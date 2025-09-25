// defining the mutation to create a sale item by product
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { SALE_ITEM_FRAGMENT } from "../Fragments/SaleItemFragments";

export const CREATE_SALE_ITEM_MUTATION = gql`
  mutation CreateSaleItem($saleItem: saleItemInput!) {
    createSaleByProduct(saleItem: $saleItem) {
      ...SaleItemFragment
    }
  }
  ${SALE_ITEM_FRAGMENT}
`;
/**
 * useCreateSaleItemMutation
 * This hook runs a mutation to create a new sale item by product.
 * It uses the CREATE_SALE_ITEM_MUTATION mutation to create a new sale item.
 * It returns a tuple with a mutate function and an object with the following properties:
 * - data: the sale item data.
 * - loading: a boolean indicating if the mutation is in progress.
 * - error: an error object if the mutation fails.
 * @returns {array} a tuple with the mutate function and an object with the above properties.
 * @example
 * const [createSaleItem, { data, loading, error }] = useCreateSaleItemMutation();
 */

export const useCreateSaleItemMutation = () => {
  const [createSaleItem, { data, loading, error, client }] = useMutation(
    CREATE_SALE_ITEM_MUTATION,
    {
      // Use update function to manually clear cache
      update: (cache, { data }) => {
        if (data?.createSaleByProduct) {
          console.log('🗑️ Clearing Apollo cache after sale creation...');
          
          // Clear all cached queries related to this product
          const productId = data.createSaleByProduct.product_id;
          
          // Evict all product-related cache entries
          cache.evict({ 
            id: `Product:${productId}` 
          });
          
          // Evict paginated queries for this product
          cache.evict({ 
            fieldName: 'paginatedSaleItemsByProduct',
            args: { productId }
          });
          
          cache.evict({ 
            fieldName: 'paginatedStockMovementsByProduct', 
            args: { productId }
          });
          
          cache.evict({ 
            fieldName: 'paginatedPurchaseItemsByProduct',
            args: { productId }
          });
          
          cache.evict({ 
            fieldName: 'productById',
            args: { id: productId }
          });
          
          // Garbage collect evicted entries
          cache.gc();
          
          // As a last resort, clear the entire store to force fresh data
          setTimeout(() => {
            cache.reset();
            console.log('🗑️ Complete Apollo cache reset performed');
          }, 100);
          
          console.log('✅ Apollo cache cleared successfully');
        }
      },
      // Force network-only fetch policy for next queries
      fetchPolicy: 'network-only'
    }
  );
  return { createSaleItem, data, loading, error, client };
};
