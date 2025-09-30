// src/components/Search/ResultCards.jsx
// Beautiful search result cards with modern design, icons, and animations
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, TrendingUp, Users, Truck, User,
  Building, Tag, Clock, DollarSign, Hash, Eye, Edit,
  ExternalLink, ArrowUpRight, Calendar, MapPin
} from 'lucide-react';

// Utility functions
const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatNumber = (num) => {
  if (!num || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
};

// Badge component
const Badge = ({ children, color = 'blue', size = 'sm' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${colors[color]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

// Stock progress indicator
const StockProgress = ({ current, total, showLabels = true }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const getColor = () => {
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        {showLabels && (
          <>
            <span>Stock Level</span>
            <span>{current}/{total}</span>
          </>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-2 rounded-full ${getColor()}`}
        />
      </div>
    </div>
  );
};

// Product Card
export const ProductCard = memo(({ product, onAction }) => {
  console.log('ProductCard received:', product);
  
  if (!product) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Product data unavailable</div>
      </div>
    );
  }
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.02 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group"
  >
    <div className="flex items-start gap-4">
      {/* Product Image */}
      <div className="relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        )}
        {product.available <= 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {product.category && (
                <Badge color="purple">{product.category}</Badge>
              )}
              <Badge color="green">{formatCurrency(product.price)}</Badge>
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="mt-4">
          <StockProgress current={product.available} total={product.stock} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Hash className="w-4 h-4" />
            <span>ID: {product.id}</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>Reserved: {formatNumber(product.reserved)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Link
          to={`/dashboard/products/${product.id}`}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
        {onAction && (
          <button
            onClick={() => onAction(product, 'edit')}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

// Sale Card
export const SaleCard = memo(({ sale, onAction }) => {
  console.log('SaleCard received:', sale);
  
  if (!sale) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Sale data unavailable</div>
      </div>
    );
  }
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-green-200">
          <TrendingUp className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Order #{sale.id}</h3>
            <Badge color="green">{formatCurrency(sale.total_amount)}</Badge>
          </div>
          <p className="text-gray-600 mt-1">{sale.customer_name || 'Anonymous Customer'}</p>
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(sale.sale_date)}</span>
          </div>
        </div>
      </div>
      
      {onAction && (
        <button
          onClick={() => onAction(sale, 'view')}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
    </div>
  </motion.div>
  );
});

SaleCard.displayName = 'SaleCard';

// Purchase Card
export const PurchaseCard = memo(({ purchase, onAction }) => {
  if (!purchase) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Purchase data unavailable</div>
      </div>
    );
  }
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200">
          <ShoppingCart className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">PO #{purchase.id}</h3>
            <Badge color="yellow">{formatCurrency(purchase.total_amount)}</Badge>
          </div>
          <p className="text-gray-600 mt-1">
            {purchase.supplier?.name || `Supplier #${purchase.supplier_id}`}
          </p>
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(purchase.purchase_date)}</span>
          </div>
        </div>
      </div>
      
      {onAction && (
        <button
          onClick={() => onAction(purchase, 'view')}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
    </div>
  </motion.div>
  );
});

PurchaseCard.displayName = 'PurchaseCard';

// Stock Movement Card
export const MovementCard = memo(({ movement, onAction }) => {
  if (!movement) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Movement data unavailable</div>
      </div>
    );
  }
  
  const isInbound = movement.type?.toLowerCase() === 'in';
  const colorClass = isInbound ? 'from-green-100 to-green-200' : 'from-red-100 to-red-200';
  const iconColor = isInbound ? 'text-green-600' : 'text-red-600';
  const badgeColor = isInbound ? 'green' : 'red';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass}`}>
            <ArrowUpRight className={`w-6 h-6 ${iconColor} ${isInbound ? '' : 'rotate-180'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge color={badgeColor}>{movement.type?.toUpperCase() || 'MOVEMENT'}</Badge>
              <span className="font-semibold text-gray-900">Qty: {formatNumber(movement.quantity)}</span>
            </div>
            <p className="text-gray-900 font-medium mt-1">
              {movement.product?.name || 'Unknown Product'}
            </p>
            <p className="text-gray-600 text-sm mt-1">{movement.reason || 'No reason specified'}</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatDate(movement.movement_date)}</span>
            </div>
          </div>
        </div>
        
        {onAction && (
          <button
            onClick={() => onAction(movement, 'view')}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
});

MovementCard.displayName = 'MovementCard';

// User Card
export const UserCard = memo(({ user, onAction }) => {
  if (!user) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">User data unavailable</div>
      </div>
    );
  }
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.name}
            className="w-12 h-12 rounded-xl object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{user.name}</h3>
            <Badge color="blue">{user.role || 'User'}</Badge>
          </div>
          <p className="text-gray-600 mt-1">{user.email}</p>
        </div>
      </div>
      
      {onAction && (
        <button
          onClick={() => onAction(user, 'view')}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
    </div>
  </motion.div>
  );
});

UserCard.displayName = 'UserCard';

// Supplier Card
export const SupplierCard = memo(({ supplier, onAction }) => {
  if (!supplier) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Supplier data unavailable</div>
      </div>
    );
  }
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
          <Truck className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
          <div className="mt-2 space-y-1">
            {supplier.email && (
              <p className="text-gray-600 text-sm">{supplier.email}</p>
            )}
            {supplier.phone && (
              <p className="text-gray-600 text-sm">{supplier.phone}</p>
            )}
          </div>
        </div>
      </div>
      
      {onAction && (
        <button
          onClick={() => onAction(supplier, 'view')}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
    </div>
  </motion.div>
  );
});

SupplierCard.displayName = 'SupplierCard';

// Customer Card
export const CustomerCard = memo(({ customer, onAction }) => {
  if (!customer) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Customer data unavailable</div>
      </div>
    );
  }
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200">
          <Users className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{customer.customer_name}</h3>
          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last purchase: {formatDate(customer.last_sale_date)}</span>
          </div>
        </div>
      </div>
      
      {onAction && (
        <button
          onClick={() => onAction(customer, 'view')}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
    </div>
  </motion.div>
  );
});

CustomerCard.displayName = 'CustomerCard';

// Reason Card (for stock movement reasons)
export const ReasonCard = memo(({ reason, onAction }) => {
  if (!reason) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Reason data unavailable</div>
      </div>
    );
  }
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
          <Tag className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{reason.reason}</h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge color="gray">{formatNumber(reason.cnt)} occurrences</Badge>
          </div>
        </div>
      </div>
      
      {onAction && (
        <button
          onClick={() => onAction(reason, 'view')}
          className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
    </div>
  </motion.div>
  );
});

ReasonCard.displayName = 'ReasonCard';

// Category Card
export const CategoryCard = memo(({ category, onAction }) => {
  if (!category) {
    return (
      <div className="bg-gray-100 rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="text-gray-500">Category data unavailable</div>
      </div>
    );
  }
  
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2, scale: 1.01 }}
    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200">
          <Building className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{category.name}</h3>
          {category.description && (
            <p className="text-gray-600 text-sm mt-1">{category.description}</p>
          )}
        </div>
      </div>
      
      <Link
        to={`/dashboard/categories`}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
      </Link>
    </div>
  </motion.div>
  );
});

CategoryCard.displayName = 'CategoryCard';
