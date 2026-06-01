import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

const BASE_URL = 'https://graph.facebook.com/v25.0';

interface FbAdAccount {
  id: string;
  name: string;
}

export interface FbCampaign {
  id: string;
  name: string;
  daily_budget: string;
  lifetime_budget: string;
  insights?: {
    data: Array<{ impressions: string; clicks: string }>;
  };
}

interface FbListResponse<T> {
  data: T[];
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

  async getCampaigns(accountId: string, accessToken: string): Promise<FbCampaign[]> {
    const fields = 'id,name,daily_budget,lifetime_budget,insights.date_preset(last_30d){impressions,clicks}';
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<FbListResponse<FbCampaign>>(`${BASE_URL}/${accountId}/campaigns`, {
          params: { fields, access_token: accessToken },
        }),
      );
      return data.data;
    } catch (err) {
      throw new BadGatewayException(err?.response?.data?.error?.message ?? 'Facebook API error');
    }
  }
}
