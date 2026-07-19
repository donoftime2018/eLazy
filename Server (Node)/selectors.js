module.exports = {
  SELECTORS: {
    // Search results
    results: ".srp-results.srp-grid",
    card: ".s-card",
    numberOfResults: ".srp-controls__count-heading>.BOLD",

    // Core listing data
    link: "a[href*='/itm/']",
    title: ".su-card-container__header .s-card__link",
    price: ".s-card__price",
    image: ".su-image img",
    condition: ".s-card__subtitle",
    bestOffer: ".su-card-container__attributes__primary>.s-card__attribute-row:nth-child(2)",
    deliveryFee: ".su-card-container__attributes__primary>.s-card__attribute-row:nth-child(3)",
    location: ".su-card-container__attributes__primary>.s-card__attribute-row:nth-child(4)",

    // Search metadata
    fewerWordsNotice: ".section-notice__main",

    // Pagination
    pagination: ".s-pagination",
    paginationLinks: ".s-pagination a",
    currentPage: ".pagination__item--current"
}}