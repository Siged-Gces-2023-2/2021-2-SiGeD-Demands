function clearQueryParams(queryParams) {
    queryParams && Object.keys(queryParams).forEach((key) => ['null', 'undefined', ''].includes(queryParams[key].trim()) && delete queryParams[key]);
    return queryParams ?? {};
}

module.exports = {
    clearQueryParams,
}