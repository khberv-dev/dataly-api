import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

const BASE_URL = 'https://graph.facebook.com/v25.0';

const INSIGHT_FIELDS = `insights.date_preset(last_30d){${[
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
].join(',')}}`;

export interface FbAdAccount {
  id: string;
  name: string;
}

export interface ActionValue {
  action_type: string;
  value: string;
}

interface FbInsightData {
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
  insights?: {
    data: FbInsightData[];
  };
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

  async getCampaigns(accountId: string, accessToken: string): Promise<FbCampaign[]> {
    const fields = `id,name,${INSIGHT_FIELDS}`;
    const all: FbCampaign[] = [];
    let after: string | undefined;

    try {
      do {
        const { data } = await firstValueFrom(
          this.httpService.get<FbListResponse<FbCampaign>>(`${BASE_URL}/${accountId}/campaigns`, {
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
