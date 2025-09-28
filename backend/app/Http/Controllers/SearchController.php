<?php

namespace App\Http\Controllers;

use App\Http\Requests\SearchRequestInput;
use App\Services\SearchService;

class SearchController extends Controller
{
    public function __construct(
        protected SearchService $searchService,
    ) {}

    public function searchAll(SearchRequestInput $request)
    {
        $params = $request->sanitized();
        $results = $this->searchService->searchAll($params);
        return response()->json($results);
    }
}
