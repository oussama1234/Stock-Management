// Compact Footer.jsx - One Line Layout
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 py-3 px-4"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 text-sm">
        <div className="flex items-center text-gray-600 dark:text-gray-300">
          <span>Made with</span>
          <Heart className="h-4 w-4 mx-1 text-red-500 fill-current" />
          <span>by Oussama Meqqadmi</span>
        </div>

        <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
          </div>
          <span>© {currentYear} Stock Manager</span>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
