// Footer.jsx
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-blue-900 to-indigo-800 border-t border-indigo-700/50 py-3 px-4 text-white"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
        <div className="flex items-center text-sm text-blue-200">
          <span>Made with</span>
          <Heart className="h-4 w-4 mx-1 text-red-400 fill-current" />
          <span>by Oussama Meqqadmi</span>
        </div>

        <div className="flex space-x-6 text-sm">
          <motion.a
            whileHover={{ scale: 1.05, color: "#ffffff" }}
            href="#"
            className="text-blue-200 hover:text-white transition-colors duration-300"
          >
            Contact
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, color: "#ffffff" }}
            href="#"
            className="text-blue-200 hover:text-white transition-colors duration-300"
          >
            Privacy
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, color: "#ffffff" }}
            href="#"
            className="text-blue-200 hover:text-white transition-colors duration-300"
          >
            Terms
          </motion.a>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
