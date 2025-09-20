<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * CacheHelper
 *
 * Centralized helper for building stable, namespaced cache keys and for
 * performing namespace invalidation (aka version bumping) without relying on
 * cache driver tag support.
 *
 * Why namespaces?
 * - Laravel's file cache driver does not support cache tags, so selective
 *   invalidation via wildcard/patterns isn't possible. Instead, we embed a
 *   monotonically increasing "namespace version" into keys. When data changes,
 *   we bump the namespace version; all previously cached entries become stale
 *   automatically because their keys no longer match.
 */
final class CacheHelper
{
    /**
     * Build a cache key for a given logical area and logical name.
     * The key includes a namespace version and a compact hash for payload parts.
     *
     * Example result: products:v3:list:2b1cfe0
     *
     * @param string $area Area bucket, e.g. 'products', 'users', 'dashboard_metrics'
     * @param string $name Logical key name within the area, e.g. 'list', 'by_id'
     * @param array $parts Optional parts that influence the key (arguments, select fields ...)
     */
    public static function key(string $area, string $name, array $parts = []): string
    {
        $ns = self::ns($area);
        $suffix = '';
        if (!empty($parts)) {
            // Hash the parts for brevity and to avoid overly long file paths in file cache
            $suffix = ':' . substr(md5(json_encode($parts)), 0, 16);
        }
        return sprintf('%s:%s:%s%s', $area, $ns, $name, $suffix);
    }

    /**
     * Retrieve the current namespace version label for an area, e.g. 'v1', 'v2'.
     */
    public static function ns(string $area): string
    {
        $k = self::nsKey($area);
        $ver = Cache::get($k, 1);
        return 'v' . (int) $ver;
    }

    /**
     * Bump the namespace version for an area to invalidate older entries.
     */
    public static function bump(string $area): void
    {
        $k = self::nsKey($area);
        if (Cache::has($k)) {
            Cache::increment($k);
        } else {
            // Initialize to 2 so first bump invalidates v1
            Cache::put($k, 2, now()->addDays(30));
        }
    }

    /**
     * Compute a TTL in seconds from env with a default fallback.
     * This keeps TTLs consistent and configurable per environment.
     */
    public static function ttlSeconds(string $envKey, int $default): int
    {
        $val = (int) env($envKey, $default);
        return $val > 0 ? $val : $default;
    }

    private static function nsKey(string $area): string
    {
        return sprintf('ns:%s', $area);
    }
}
