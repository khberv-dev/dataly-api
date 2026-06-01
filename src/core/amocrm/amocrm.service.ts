import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

const MAX_PAGES = 100;
const PAGE_LIMIT = 250;

export interface AmoDeal {
  id: number;
  name: string;
  price: number;
  status_id: number;
  pipeline_id: number;
  created_at: number;
  updated_at: number;
}

interface AmoDealsResponse {
  _links?: { next?: { href: string } };
  _embedded?: { leads: AmoDeal[] };
}

@Injectable()
export class AmoCrmService {
  constructor(private readonly httpService: HttpService) {}

  parseKey(raw: string): { domain: string; accessToken: string } {
    const idx = raw.indexOf(':');
    return { domain: raw.substring(0, idx), accessToken: raw.substring(idx + 1) };
  }

  async getDeals(domain: string, accessToken: string): Promise<AmoDeal[]> {
    const all: AmoDeal[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const response = await this.fetchPage(domain, accessToken, page);
      const leads = response._embedded?.leads ?? [];
      all.push(...leads);

      if (!response._links?.next || leads.length < PAGE_LIMIT) break;
      page++;
    }

    return all;
  }

  private async fetchPage(domain: string, accessToken: string, page: number): Promise<AmoDealsResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<AmoDealsResponse>(`https://${domain}/api/v4/leads`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page, limit: PAGE_LIMIT },
        }),
      );
      return data;
    } catch (err) {
      const message = err?.response?.data?.detail ?? err?.response?.data?.title ?? 'amoCRM API error';
      throw new BadGatewayException(message);
    }
  }
}
