/**
 * Standardized response formatters for consistent API responses
 */

/**
 * Format a successful response with data
 * @param {any} data - The data to return
 * @param {Object} meta - Optional metadata (pagination, totals, etc.)
 * @returns {Object} Formatted response
 */
export function successResponse(data, meta = null) {
    const response = { data };

    if (meta) {
        response.meta = meta;
    }

    return response;
}

/**
 * Format a paginated response
 * @param {Array} items - The items for this page
 * @param {Object} pagination - Pagination info
 * @returns {Object} Formatted paginated response
 */
export function paginatedResponse(items, pagination) {
    return {
        data: items,
        pagination: {
            limit: pagination.limit,
            offset: pagination.offset,
            total: pagination.total,
            hasMore: pagination.offset + pagination.limit < pagination.total,
            page: Math.floor(pagination.offset / pagination.limit) + 1,
            totalPages: Math.ceil(pagination.total / pagination.limit),
        },
    };
}

/**
 * Format a deleted response
 * @param {number} count - Number of items deleted
 * @returns {Object} Formatted delete response
 */
export function deletedResponse(count = 1) {
    return {
        deleted: count,
        message: `Successfully deleted ${count} item${count !== 1 ? 's' : ''}`,
    };
}

/**
 * Format a created response
 * @param {any} data - The created resource
 * @param {string} location - Optional location header value
 * @returns {Object} Formatted create response
 */
export function createdResponse(data, location = null) {
    const response = {
        data,
        message: 'Resource created successfully',
    };

    if (location) {
        response.location = location;
    }

    return response;
}

/**
 * Format an updated response
 * @param {any} data - The updated resource
 * @returns {Object} Formatted update response
 */
export function updatedResponse(data) {
    return {
        data,
        message: 'Resource updated successfully',
    };
}
