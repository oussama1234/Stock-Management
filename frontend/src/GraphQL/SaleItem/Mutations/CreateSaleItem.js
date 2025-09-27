// defining the mutation to create a sale item by product
import { gql, useMutation } from "@apollo/client";
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
      // DISABLE ALL CACHING for mutation
      fetchPolicy: 'no-cache',
      
      // Add cache-busting context
      context: {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'x-no-cache': 'true'
        }
      },
      
      // NUCLEAR cache clearing after mutation
      update: (cache, { data }) => {
        if (data?.createSaleByProduct) {
          const productId = data.createSaleByProduct.product_id;
          
          try {
            // STEP 1: Evict specific fields with args
            cache.evict({ 
              fieldName: 'productById',
              args: { id: productId }
            });
            cache.evict({ 
              fieldName: 'paginatedSaleItemsByProduct',
              args: { product_id: productId }
            });
            cache.evict({ 
              fieldName: 'paginatedStockMovementsByProduct',
              args: { product_id: productId }
            });
            cache.evict({ 
              fieldName: 'paginatedPurchaseItemsByProduct',
              args: { product_id: productId }
            });
            
            // STEP 2: Evict entire field types (nuclear option)
            cache.evict({ fieldName: 'productById' });
            cache.evict({ fieldName: 'paginatedSaleItemsByProduct' });
            cache.evict({ fieldName: 'paginatedStockMovementsByProduct' });
            cache.evict({ fieldName: 'paginatedPurchaseItemsByProduct' });
            
            // STEP 3: Clear entire cache if needed (ultimate nuclear option)
            // Enable this for testing - full cache reset
            cache.reset();
            
            // Force garbage collection
            cache.gc();
            
          } catch (evictError) {
            // Last resort: clear everything
            try {
              cache.reset();
            } catch (resetError) {
              // Silent fallback
            }
          }
        }
      }
    }
  );
  return { createSaleItem, data, loading, error, client };
};
