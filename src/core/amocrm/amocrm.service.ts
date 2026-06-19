import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

const MAX_PAGES = 100;
const PAGE_LIMIT = 250;

export interface CustomField {
  field_id: number;
  field_name: string;
  field_code: string;
  field_type: string;
  values: Array<{ value: string }>;
}

export interface AmoDeal {
  id: number;
  name: string;
  price: number;
  status_id: number;
  pipeline_id: number;
  created_at: number;
  updated_at: number;
  closed_at: number;
  custom_fields_values?: CustomField[];
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

  extractUtmField(deal: AmoDeal, fieldCode: string): string | null {
    const field = deal.custom_fields_values?.find((f) => f.field_code === fieldCode);
    return field?.values?.[0]?.value ?? null;
  }

  getDeals(domain: string, accessToken: string): Promise<AmoDeal[]> {
    return this.paginate(domain, accessToken);
  }

  getAllClosedDeals(domain: string, accessToken: string, from: number, to: number): Promise<AmoDeal[]> {
    return this.paginate(domain, accessToken, {
      'filter[closed_at][from]': String(from),
      'filter[closed_at][to]': String(to),
    });
  }

  private async paginate(
    domain: string,
    accessToken: string,
    extraParams: Record<string, string> = {},
  ): Promise<AmoDeal[]> {
    const all: AmoDeal[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const response = await this.fetchPage(domain, accessToken, page, extraParams);
      const leads = response._embedded?.leads ?? [];
      all.push(...leads);
      if (!response._links?.next || leads.length < PAGE_LIMIT) break;
      page++;
    }

    return all;
  }

  private async fetchPage(
    domain: string,
    accessToken: string,
    page: number,
    extraParams: Record<string, string> = {},
  ): Promise<AmoDealsResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<AmoDealsResponse>(`https://${domain}/api/v4/leads`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page, limit: PAGE_LIMIT, with: 'custom_fields_values', ...extraParams },
        }),
      );
      return data;
    } catch (err) {
      const message = err?.response?.data?.detail ?? err?.response?.data?.title ?? 'amoCRM API error';
      throw new BadGatewayException(message);
    }
  }
}
