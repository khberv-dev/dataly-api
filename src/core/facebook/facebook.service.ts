import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

const BASE_URL = 'https://graph.facebook.com/v25.0';

const INSIGHT_FIELD_LIST = [
  'impressions',
  'clicks',
  'spend',
  'reach',
  'frequency',
  'cpm',
  'video_thruplay_watched_actions',
  'video_p25_watched_actions',
  'video_p50_watched_actions',
  'video_p75_watched_actions',
  'video_p100_watched_actions',
  'video_avg_time_watched_actions',
  'outbound_clicks',
];

function buildInsightFields(from: string, to: string): string {
  return `insights.time_range({"since":"${from}","until":"${to}"}){${INSIGHT_FIELD_LIST.join(',')}}`;
}

export interface FbAdAccount {
  id: string;
  name: string;
}

export interface ActionValue {
  action_type: string;
  value: string;
}

export interface FbInsightData {
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  frequency: string;
  cpm: string;
  video_thruplay_watched_actions?: ActionValue[];
  video_p25_watched_actions?: ActionValue[];
  video_p50_watched_actions?: ActionValue[];
  video_p75_watched_actions?: ActionValue[];
  video_p100_watched_actions?: ActionValue[];
  video_avg_time_watched_actions?: ActionValue[];
  outbound_clicks?: ActionValue[];
}

export interface FbCampaign {
  id: string;
  name: string;
  insights?: { data: FbInsightData[] };
}

export interface FbAdSet {
  id: string;
  name: string;
  campaign_id: string;
  insights?: { data: FbInsightData[] };
}

export interface FbAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  insights?: { data: FbInsightData[] };
}

interface FbListResponse<T> {
  data: T[];
  paging?: {
    cursors?: { after?: string };
    next?: string;
  };
}

@Injectable()
export class FacebookService {
  constructor(private readonly httpService: HttpService) {}

  async getAdAccounts(accessToken: string): Promise<FbAdAccount[]> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<FbListResponse<FbAdAccount>>(`${BASE_URL}/me/adaccounts`, {
          params: { fields: 'id,name', access_token: accessToken },
        }),
      );
      return data.data;
    } catch (err) {
      throw new BadGatewayException(err?.response?.data?.error?.message ?? 'Facebook API error');
    }
  }

  async getFbLeadCampaignId(leadId: string, accessToken: string): Promise<string | null> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ campaign_id?: string }>(`https://graph.facebook.com/v20.0/${leadId}`, {
          params: { fields: 'id,campaign_id', access_token: accessToken },
        }),
      );
      return data.campaign_id ?? null;
    } catch {
      return null;
    }
  }

  async getCampaigns(accountId: string, accessToken: string, from: string, to: string): Promise<FbCampaign[]> {
    return this.paginate<FbCampaign>(
      `${BASE_URL}/${accountId}/campaigns`,
      `id,name,${buildInsightFields(from, to)}`,
      accessToken,
    );
  }

  async getAdSets(accountId: string, accessToken: string, from: string, to: string): Promise<FbAdSet[]> {
    return this.paginate<FbAdSet>(
      `${BASE_URL}/${accountId}/adsets`,
      `id,name,campaign_id,${buildInsightFields(from, to)}`,
      accessToken,
    );
  }

  async getAds(accountId: string, accessToken: string, from: string, to: string): Promise<FbAd[]> {
    return this.paginate<FbAd>(
      `${BASE_URL}/${accountId}/ads`,
      `id,name,adset_id,campaign_id,${buildInsightFields(from, to)}`,
      accessToken,
    );
  }

  async getAdsByAdSet(adsetId: string, accessToken: string, from: string, to: string): Promise<FbAd[]> {
    return this.paginate<FbAd>(
      `${BASE_URL}/${adsetId}/ads`,
      `id,name,adset_id,campaign_id,${buildInsightFields(from, to)}`,
      accessToken,
    );
  }

  private async paginate<T>(url: string, fields: string, accessToken: string): Promise<T[]> {
    const all: T[] = [];
    let after: string | undefined;

    try {
      do {
        const { data } = await firstValueFrom(
          this.httpService.get<FbListResponse<T>>(url, {
            params: { fields, access_token: accessToken, ...(after ? { after } : {}) },
          }),
        );
        all.push(...data.data);
        after = data.paging?.next ? data.paging.cursors?.after : undefined;
      } while (after);
    } catch (err) {
      throw new BadGatewayException(err?.response?.data?.error?.message ?? 'Facebook API error');
    }

    return all;
  }
}
