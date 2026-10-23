// Category fetcher — injected into the Shopee tab (MAIN world) to read each product's category.
// Built as a standalone IIFE; the bundle calls run() with the request the dashboard left on window.

export interface ItemRequest {
  itemId: number;
  shopId: number;
}

interface CategoryNode {
  catid: number;
  name: string;
}

export interface CategoryResult {
  /** Category path per item id; an empty path means Shopee has no category for the product. */
  categories: Record<string, { path: CategoryNode[] }>;
  /** Item ids that still failed after every retry. */
  failed: string[];
}

interface RawCategory {
  catid: number;
  display_name: string;
}

// Same pacing and retry policy as the order fetcher, one request at a time.
const MIN_REQUEST_GAP_MS = 400;
const REQUEST_JITTER_MS = 200;
const RETRY_DELAYS_MS = [2000, 5000, 10000];

class FetchError extends Error {
  constructor(message: string, readonly retriable: boolean) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function getCategoryPath({ itemId, shopId }: ItemRequest): Promise<CategoryNode[]> {
  let response: Response;
  try {
    response = await fetch(`/api/v4/pdp/get_pc?item_id=${itemId}&shop_id=${shopId}&detail_level=0`);
  } catch (error) {
    throw new FetchError((error as Error).message || 'Network error', true);
  }
  if (!response.ok) {
    throw new FetchError(`HTTP ${response.status}`, response.status === 429 || response.status >= 500);
  }
  let json: { error?: number | null; error_msg?: string; data?: { item?: { categories?: RawCategory[] } | null } | null };
  try {
    json = await response.json();
  } catch {
    throw new FetchError('Invalid response', true);
  }
  if (json?.error) throw new FetchError(json.error_msg || `Shopee API error: ${json.error}`, true);
  // No item at all may be a removed product or a blocked reply; ask again on the next run, not now.
  const item = json?.data?.item;
  if (!item) throw new FetchError('Product not found', false);
  // A product Shopee returns but has not categorised has no category.
  return Array.isArray(item.categories) ? item.categories.map(node => ({ catid: node.catid, name: node.display_name })) : [];
}

export async function run(request: { items: ItemRequest[] } | undefined): Promise<CategoryResult> {
  const result: CategoryResult = { categories: {}, failed: [] };
  let first = true;

  for (const item of request?.items ?? []) {
    let path: CategoryNode[] | null = null;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length && path === null; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
      if (!first) await sleep(MIN_REQUEST_GAP_MS + Math.random() * REQUEST_JITTER_MS);
      first = false;
      try {
        path = await getCategoryPath(item);
      } catch (error) {
        if (!(error as FetchError).retriable) break;
      }
    }
    if (path === null) result.failed.push(String(item.itemId));
    else result.categories[String(item.itemId)] = { path };
  }
  return result;
}
