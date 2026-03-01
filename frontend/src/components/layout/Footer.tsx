'use client';

import { motion } from 'framer-motion';
import { Zap, Twitter, Github, MessageCircle, Mail, ExternalLink, ArrowUpRight, Heart, Globe } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  Protocol: [
    { name: 'Vaults', href: '#vaults' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Documentation', href: '#docs' },
    { name: 'API', href: '#api' },
  ],
  Resources: [
    { name: 'Audit Report', href: '#' },
    { name: 'Bug Bounty', href: '#' },
    { name: 'Brand Assets', href: '#' },
    { name: 'Roadmap', href: '#' },
  ],
  Community: [
    { name: 'Discord', href: '#' },
    { name: 'Twitter', href: '#' },
    { name: 'Forum', href: '#' },
    { name: 'Blog', href: '#' },
  ],
};

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:bg-blue-500/20 hover:text-blue-400' },
  { name: 'Github', icon: Github, href: '#', color: 'hover:bg-purple-500/20 hover:text-purple-400' },
  { name: 'Discord', icon: MessageCircle, href: '#', color: 'hover:bg-indigo-500/20 hover:text-indigo-400' },
  { name: 'Email', icon: Mail, href: 'mailto:hello@vortexfi.io', color: 'hover:bg-pink-500/20 hover:text-pink-400' },
];

const partners = [
  { name: 'Polygon', logo: '🟣' },
  { name: 'Aave', logo: '👻' },
  { name: 'Compound', logo: '📗' },
  { name: 'Lido', logo: '🌊' },
  { name: 'GMX', logo: '💎' },
];

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[128px]" />
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Animated border */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-3xl opacity-50" />
          
          <div className="relative bg-gradient-to-b from-purple-900/50 to-black/90 backdrop-blur-xl rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Ready to go chainless?
                </h3>
                <p className="text-gray-400">
                  Start earning yield from any chain with a single click.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-8 py-4 rounded-2xl font-semibold text-white overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Launch App
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Partners Section */}
      <div className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <span className="text-gray-500 text-sm">Powered by</span>
            <div className="flex items-center gap-8">
              {partners.map((partner, i) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <span className="text-2xl">{partner.logo}</span>
                  <span className="text-sm font-medium">{partner.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl blur opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-purple-600 to-cyan-600 p-2.5 rounded-xl">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  VortexFi
                </span>
              </Link>
              <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
                Spin up yield across any chain. We make every Polygon chain feel like one big DeFi engine.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-gray-400 transition-all duration-300 ${social.color}`}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>

              {/* Network Status */}
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-green-400 rounded-full"
                />
                <span>All systems operational</span>
              </div>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <motion.div 
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link, linkIndex) => (
                    <motion.li 
                      key={link.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: categoryIndex * 0.1 + linkIndex * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1 group"
                      >
                        {link.name}
                        <ExternalLink className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.p 
              className="text-gray-500 text-sm flex items-center gap-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              © 2026 VortexFi. Built with{' '}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              </motion.span>
              {' '}on Polygon AggLayer
            </motion.p>
            
            <div className="flex items-center gap-6 text-sm">
              <Link 
                href="#" 
                className="text-gray-500 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="#" 
                className="text-gray-500 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <div className="flex items-center gap-2 text-gray-500">
                <Globe className="w-4 h-4" />
                <select className="bg-transparent border-none text-sm focus:outline-none cursor-pointer">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
