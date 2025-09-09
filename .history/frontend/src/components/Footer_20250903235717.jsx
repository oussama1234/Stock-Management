// Footer.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Github, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-indigo-900 border-t border-white/10 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="col-span-1 md:col-span-2"
          >
            <div className="flex items-center mb-4">
              <BarChart3 className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-xl font-bold">StockAI Manager</span>
            </div>
            <p className="text-blue-200 max-w-md">
              Intelligent inventory management system powered by AI to optimize your stock levels, 
              predict demand, and streamline your operations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">About Us</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">Careers</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">Blog</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">Press</a></li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">Terms of Service</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">Cookie Policy</a></li>
              <li><a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">GDPR</a></li>
            </ul>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-blue-200 text-sm flex items-center">
            Made with <Heart className="h-4 w-4 mx-1 text-red-500 fill-current" /> by StockAI Team
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-blue-200 hover:text-white transition-colors duration-300">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;