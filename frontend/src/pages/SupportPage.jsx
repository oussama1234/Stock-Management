// SupportPage.jsx - Modern Support & Help Center with glassmorphism design
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Users,
  Zap,
  Shield,
  Book,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  HeadphonesIcon,
  Globe,
  FileText,
  Video,
  Download
} from "lucide-react";
import { useState } from "react";
import { usePreferences } from "../context/PreferencesContext";

const SupportPage = () => {
  const { currentTheme } = usePreferences();
  const [activeTab, setActiveTab] = useState('faq');
  const [searchTerm, setSearchTerm] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  const tabs = [
    { id: 'faq', name: 'FAQ', icon: HelpCircle },
    { id: 'contact', name: 'Contact Us', icon: MessageCircle },
    { id: 'guides', name: 'Guides', icon: Book },
    { id: 'status', name: 'System Status', icon: Zap },
  ];

  const faqs = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I add products to my inventory?',
      answer: 'To add products to your inventory, navigate to the Products page from the sidebar menu. Click the "Add Product" button and fill in the product details including name, SKU, quantity, price, and category. Make sure to upload a product image for better organization.',
      tags: ['products', 'inventory', 'basics']
    },
    {
      id: 2,
      category: 'Inventory Management',
      question: 'How do I set up low stock alerts?',
      answer: 'Low stock alerts can be configured in your profile preferences. Go to My Profile > Preferences and enable "Low Stock Alerts". You can also set minimum stock levels for individual products in the product edit screen.',
      tags: ['alerts', 'notifications', 'stock']
    },
    {
      id: 3,
      category: 'Reports & Analytics',
      question: 'How can I generate sales reports?',
      answer: 'Access the Sales Analytics page from the sidebar. You can generate reports for different time periods, filter by products or categories, and export data to CSV or PDF formats. The system provides real-time analytics and trend insights.',
      tags: ['reports', 'analytics', 'sales']
    },
    {
      id: 4,
      category: 'User Management',
      question: 'How do I add team members to my account?',
      answer: 'Go to the Users page (Admin access required) and click "Add User". Enter their email, assign a role (Admin, Manager, or User), and they will receive an invitation email to set up their account.',
      tags: ['users', 'team', 'permissions']
    },
    {
      id: 5,
      category: 'Security',
      question: 'How do I enable two-factor authentication?',
      answer: 'Navigate to My Profile > Security tab. Toggle on "Two-Factor Authentication" and follow the setup instructions. You can use apps like Google Authenticator or Authy for generating codes.',
      tags: ['2fa', 'security', 'authentication']
    },
    {
      id: 6,
      category: 'Troubleshooting',
      question: 'Why are my notifications not working?',
      answer: 'Check your notification preferences in My Profile > Preferences. Ensure that both browser notifications and email notifications are enabled. Also verify that your browser allows notifications for this site.',
      tags: ['notifications', 'troubleshooting', 'settings']
    }
  ];

  const guides = [
    {
      id: 1,
      title: 'Getting Started Guide',
      description: 'Complete walkthrough for new users',
      type: 'video',
      duration: '15 min',
      difficulty: 'Beginner',
      icon: Video,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      title: 'Inventory Management Best Practices',
      description: 'Optimize your stock management workflow',
      type: 'document',
      duration: '10 min read',
      difficulty: 'Intermediate',
      icon: FileText,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      title: 'Advanced Analytics & Reporting',
      description: 'Master the analytics dashboard',
      type: 'video',
      duration: '20 min',
      difficulty: 'Advanced',
      icon: Video,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 4,
      title: 'API Documentation',
      description: 'Integrate with third-party systems',
      type: 'document',
      duration: '25 min read',
      difficulty: 'Advanced',
      icon: Download,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const systemStatus = [
    { service: 'Web Application', status: 'operational', uptime: '99.9%' },
    { service: 'API Services', status: 'operational', uptime: '99.8%' },
    { service: 'Database', status: 'operational', uptime: '100%' },
    { service: 'File Storage', status: 'maintenance', uptime: '98.5%' },
    { service: 'Email Service', status: 'operational', uptime: '99.7%' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'outage': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return CheckCircle;
      case 'maintenance': return AlertCircle;
      case 'outage': return AlertCircle;
      default: return Info;
    }
  };

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    // Reset form or show success message
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-blue-50/40 to-indigo-50/60 dark:from-gray-900/80 dark:via-gray-800/40 dark:to-gray-900/60 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Help & Support
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Get the help you need to make the most of Stock Manager
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Quick Stats & Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Support Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Avg Response</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">2 hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Satisfaction</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">98%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Resolution</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">95%</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">support@stockmanager.com</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Phone</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Hours</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Mon-Fri: 9AM-6PM EST</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {/* Tab Navigation */}
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex space-x-1 bg-gray-100/80 dark:bg-gray-700/80 rounded-2xl p-1">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                          activeTab === tab.id
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'faq' && (
                    <motion.div
                      key="faq"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Search */}
                      <div className="mb-6">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search FAQ..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>

                      {/* FAQ List */}
                      <div className="space-y-4">
                        {filteredFAQs.map((faq, index) => (
                          <motion.div
                            key={faq.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl overflow-hidden"
                          >
                            <button
                              onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                    {faq.category}
                                  </span>
                                </div>
                                <h3 className="font-medium text-gray-800 dark:text-white">
                                  {faq.question}
                                </h3>
                              </div>
                              {openFAQ === faq.id ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                              )}
                            </button>
                            <AnimatePresence>
                              {openFAQ === faq.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="px-4 pb-4"
                                >
                                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {faq.answer}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {faq.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'contact' && (
                    <motion.div
                      key="contact"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="max-w-2xl">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                          Send us a message
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                          We're here to help! Send us your question and we'll get back to you as soon as possible.
                        </p>

                        <form onSubmit={handleContactSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Name
                              </label>
                              <input
                                type="text"
                                name="name"
                                value={contactForm.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-gray-800 dark:text-white"
                                placeholder="Your full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Email
                              </label>
                              <input
                                type="email"
                                name="email"
                                value={contactForm.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-gray-800 dark:text-white"
                                placeholder="your@email.com"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                              Priority
                            </label>
                            <select
                              name="priority"
                              value={contactForm.priority}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-gray-800 dark:text-white"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="urgent">Urgent</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                              Subject
                            </label>
                            <input
                              type="text"
                              name="subject"
                              value={contactForm.subject}
                              onChange={handleInputChange}
                              required
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-gray-800 dark:text-white"
                              placeholder="Brief description of your issue"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                              Message
                            </label>
                            <textarea
                              name="message"
                              value={contactForm.message}
                              onChange={handleInputChange}
                              required
                              rows={6}
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-gray-800 dark:text-white resize-none"
                              placeholder="Describe your question or issue in detail..."
                            />
                          </div>

                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                          >
                            <Send className="h-4 w-4" />
                            <span>Send Message</span>
                          </motion.button>
                        </form>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'guides' && (
                    <motion.div
                      key="guides"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                          User Guides & Resources
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Learn how to make the most of Stock Manager with our comprehensive guides
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {guides.map((guide, index) => {
                          const IconComponent = guide.icon;
                          return (
                            <motion.div
                              key={guide.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-start space-x-4">
                                <div className={`p-3 bg-gradient-to-r ${guide.color} rounded-2xl shadow-lg group-hover:scale-105 transition-transform`}>
                                  <IconComponent className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {guide.title}
                                  </h4>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                                    {guide.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                      <span>{guide.duration}</span>
                                      <span className={`px-2 py-1 rounded-full ${
                                        guide.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' :
                                        guide.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-red-100 text-red-600'
                                      }`}>
                                        {guide.difficulty}
                                      </span>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'status' && (
                    <motion.div
                      key="status"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                          System Status
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Real-time status of all Stock Manager services
                        </p>
                      </div>

                      <div className="space-y-4">
                        {systemStatus.map((service, index) => {
                          const StatusIcon = getStatusIcon(service.status);
                          return (
                            <motion.div
                              key={service.service}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-gray-50/50 dark:bg-gray-700/50 rounded-2xl p-6"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <StatusIcon className={`h-5 w-5 ${
                                    service.status === 'operational' ? 'text-green-500' :
                                    service.status === 'maintenance' ? 'text-yellow-500' :
                                    'text-red-500'
                                  }`} />
                                  <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-white">
                                      {service.service}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      Uptime: {service.uptime}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl">
                        <div className="flex items-start space-x-3">
                          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                              Scheduled Maintenance
                            </h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              File Storage maintenance is scheduled for tonight at 2:00 AM EST. Expected duration: 2 hours.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;