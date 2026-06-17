import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmoCrmService, AmoDeal } from '../amocrm/amocrm.service';
import { FacebookService, FbInsightData } from '../facebook/facebook.service';
import { KeyType } from '../keys/entities/key.entity';
import { KeysService } from '../keys/keys.service';

const UZS_PER_USD = 12000;

function actVal(arr: Array<{ action_type: string; value: string }> | undefined, type?: string): number {
  if (!arr?.length) return 0;
  const item = type ? arr.find((a) => a.action_type === type) : arr[0];
  return parseFloat(item?.value ?? '0');
}

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);

  constructor(
    private readonly keysService: KeysService,
    private readonly facebookService: FacebookService,
    private readonly amoCrmService: AmoCrmService,
    private readonly configService: ConfigService,
  ) {}

  async getAccounts() {
    const key = await this.requireKey(KeyType.META);
    return this.facebookService.getAdAccounts(key);
  }

  async getCampaigns(accountId: string) {
    const utmField = this.configService.get<string>('AMO_UTM_CAMPAIGN', 'UTM_CAMPAIGN');
    const metaKey = await this.requireKey(KeyType.META);
    const amoKey = await this.keysService.findByType(KeyType.AMOCRM);

    const [campaigns, closedLeads] = await Promise.all([
      this.facebookService.getCampaigns(accountId, metaKey),
      amoKey ? this.fetchClosedLeads(amoKey.key) : Promise.resolve<AmoDeal[]>([]),
    ]);
    this.logger.log(`amoCRM closed leads (status=142, last 30d): ${closedLeads.length}`);

    const { map: allLeadsMap, utmCount, fbCount } = await this.groupLeadsByCampaign(closedLeads, utmField, metaKey);
    this.logger.log(`Leads — overall: ${closedLeads.length}, via UTM: ${utmCount}, via Facebook lead ID: ${fbCount}`);

    const leadsMap = this.filterClosed30d(allLeadsMap);

    return campaigns.map((c) => ({
      id: c.id,
      title: c.name,
      ...this.computeMetrics(c.insights?.data?.[0], leadsMap.get(c.id) ?? [], allLeadsMap.get(c.id)?.length ?? 0),
    }));
  }

  async getAdSets(accountId: string) {
    const utmField = this.configService.get<string>('AMO_UTM_ADSET', 'UTM_CONTENT');
    const metaKey = await this.requireKey(KeyType.META);
    const amoKey = await this.keysService.findByType(KeyType.AMOCRM);

    const [adsets, closedLeads] = await Promise.all([
      this.facebookService.getAdSets(accountId, metaKey),
      amoKey ? this.fetchClosedLeads(amoKey.key) : Promise.resolve<AmoDeal[]>([]),
    ]);

    const allLeadsMap = this.groupLeadsByUtm(closedLeads, utmField);
    const leadsMap = this.filterClosed30d(allLeadsMap);

    return adsets.map((a) => ({
      id: a.id,
      title: a.name,
      campaignId: a.campaign_id,
      ...this.computeMetrics(a.insights?.data?.[0], leadsMap.get(a.id) ?? [], allLeadsMap.get(a.id)?.length ?? 0),
    }));
  }

  async getAds(accountId: string) {
    const utmField = this.configService.get<string>('AMO_UTM_AD', 'UTM_SOURCE');
    const metaKey = await this.requireKey(KeyType.META);
    const amoKey = await this.keysService.findByType(KeyType.AMOCRM);

    const [ads, closedLeads] = await Promise.all([
      this.facebookService.getAds(accountId, metaKey),
      amoKey ? this.fetchClosedLeads(amoKey.key) : Promise.resolve<AmoDeal[]>([]),
    ]);

    const allLeadsMap = this.groupLeadsByUtm(closedLeads, utmField);
    const leadsMap = this.filterClosed30d(allLeadsMap);

    return ads.map((a) => ({
      id: a.id,
      title: a.name,
      adsetId: a.adset_id,
      campaignId: a.campaign_id,
      ...this.computeMetrics(a.insights?.data?.[0], leadsMap.get(a.id) ?? [], allLeadsMap.get(a.id)?.length ?? 0),
    }));
  }

  async getAdsByAdSet(adsetId: string) {
    const utmField = this.configService.get<string>('AMO_UTM_AD', 'UTM_SOURCE');
    const metaKey = await this.requireKey(KeyType.META);
    const amoKey = await this.keysService.findByType(KeyType.AMOCRM);

    const [ads, closedLeads] = await Promise.all([
      this.facebookService.getAdsByAdSet(adsetId, metaKey),
      amoKey ? this.fetchClosedLeads(amoKey.key) : Promise.resolve<AmoDeal[]>([]),
    ]);

    const allLeadsMap = this.groupLeadsByUtm(closedLeads, utmField);
    const leadsMap = this.filterClosed30d(allLeadsMap);

    return ads.map((a) => ({
      id: a.id,
      title: a.name,
      adsetId: a.adset_id,
      campaignId: a.campaign_id,
      ...this.computeMetrics(a.insights?.data?.[0], leadsMap.get(a.id) ?? [], allLeadsMap.get(a.id)?.length ?? 0),
    }));
  }

  private computeMetrics(insight: FbInsightData | undefined, leads: AmoDeal[], overallLeadsCount: number) {
    const spendUsd = parseFloat(insight?.spend ?? '0');
    const spendUzs = spendUsd * UZS_PER_USD;
    const views = parseInt(insight?.impressions ?? '0');
    const clicks = parseInt(insight?.clicks ?? '0');
    const reach = parseInt(insight?.reach ?? '0');
    const frequency = parseFloat(insight?.frequency ?? '0');
    const cpm = parseFloat(insight?.cpm ?? '0');

    const videoThruplay = Math.round(actVal(insight?.video_thruplay_watched_actions));
    const video25 = Math.round(actVal(insight?.video_p25_watched_actions));
    const video50 = Math.round(actVal(insight?.video_p50_watched_actions));
    const video75 = Math.round(actVal(insight?.video_p75_watched_actions));
    const video100 = Math.round(actVal(insight?.video_p100_watched_actions));
    const avgVideoTime = +actVal(insight?.video_avg_time_watched_actions).toFixed(1);
    const linkClicks = Math.round(actVal(insight?.outbound_clicks));

    const saleAmount = leads.reduce((sum, d) => sum + (d.price ?? 0), 0);

    const linkCtr = views > 0 ? +((linkClicks / views) * 100).toFixed(2) : 0;
    const cpl = overallLeadsCount > 0 ? +(spendUsd / overallLeadsCount).toFixed(2) : 0;
    const cac = leads.length > 0 ? +(spendUsd / leads.length).toFixed(2) : 0;
    const roas = spendUzs > 0 ? +(saleAmount / spendUzs).toFixed(2) : 0;

    return {
      spendUsd,
      cpl,
      cac,
      saleAmount,
      roas,
      reach,
      frequency,
      views,
      cpm,
      clicks,
      linkClicks,
      linkCtr,
      overallLeadsCount,
      leadsCount: leads.length,
      videoThruplay,
      video25,
      video50,
      video75,
      video100,
      avgVideoTime,
    };
  }

  private filterClosed30d(map: Map<string, AmoDeal[]>): Map<string, AmoDeal[]> {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 30 * 24 * 60 * 60;
    return new Map(
      [...map.entries()].map(([id, leads]) => [
        id,
        leads.filter((l) => l.status_id === 142 && l.closed_at >= from && l.closed_at <= now),
      ]),
    );
  }

  private async fetchClosedLeads(amoKeyRaw: string): Promise<AmoDeal[]> {
    const { domain, accessToken } = this.amoCrmService.parseKey(amoKeyRaw);
    return this.amoCrmService.getAllClosedDeals(domain, accessToken);
  }

  private groupLeadsByUtm(leads: AmoDeal[], utmFieldCode: string): Map<string, AmoDeal[]> {
    const map = new Map<string, AmoDeal[]>();
    for (const lead of leads) {
      const utm = this.amoCrmService.extractUtmField(lead, utmFieldCode);
      if (utm) this.pushToMap(map, utm, lead);
    }
    return map;
  }

  private async groupLeadsByCampaign(
    leads: AmoDeal[],
    utmFieldCode: string,
    metaKey: string,
  ): Promise<{ map: Map<string, AmoDeal[]>; utmCount: number; fbCount: number }> {
    const map = new Map<string, AmoDeal[]>();
    const needFbLookup: Array<{ lead: AmoDeal; fbLeadId: string }> = [];
    let utmCount = 0;

    for (const lead of leads) {
      const utm = this.amoCrmService.extractUtmField(lead, utmFieldCode);
      if (utm) {
        this.pushToMap(map, utm, lead);
        utmCount++;
      } else {
        const fbLeadId = this.extractFbLeadId(lead.name);
        if (fbLeadId) needFbLookup.push({ lead, fbLeadId });
      }
    }

    let fbCount = 0;
    if (needFbLookup.length) {
      const uniqueIds = [...new Set(needFbLookup.map((p) => p.fbLeadId))];
      this.logger.log(`Resolving ${uniqueIds.length} FB lead(s) without UTM`);

      const fbLeadToCampaign = new Map<string, string>();
      await Promise.allSettled(
        uniqueIds.map(async (fbLeadId) => {
          const campaignId = await this.facebookService.getFbLeadCampaignId(fbLeadId, metaKey);
          if (campaignId) fbLeadToCampaign.set(fbLeadId, campaignId);
        }),
      );

      for (const { lead, fbLeadId } of needFbLookup) {
        const campaignId = fbLeadToCampaign.get(fbLeadId);
        if (campaignId) {
          this.pushToMap(map, campaignId, lead);
          fbCount++;
        }
      }
    }

    return { map, utmCount, fbCount };
  }

  private extractFbLeadId(fromName?: string): string | null {
    if (!fromName) return null;
    const match = fromName.match(/№(\d+)/);
    return match?.[1] ?? null;
  }

  private pushToMap(map: Map<string, AmoDeal[]>, key: string, lead: AmoDeal): void {
    const bucket = map.get(key) ?? [];
    bucket.push(lead);
    map.set(key, bucket);
  }

  private async requireKey(type: KeyType): Promise<string> {
    const key = await this.keysService.findByType(type);
    if (!key) throw new BadRequestException(`${type} key not configured`);
    return key.key;
  }
}
