import React, { useState } from 'react';
import { apiClient } from '../utils/api';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.submitContact(name, email, subject, message);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400">📞 Contact Us</h1>
      
      {submitted && (
        <div className="bg-green-950 border border-green-600 rounded-lg p-6 text-center mb-8">
          <p className="text-green-400 font-bold">✅ Message sent!</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-cyan-400 mb-2">Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-cyan-400 mb-2">Email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-cyan-400 mb-2">Subject *</label>
          <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white" />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-cyan-400 mb-2">Message *</label>
          <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows="6" className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"></textarea>
        </div>
        
        <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-purple-600 text-black font-bold rounded-lg hover:shadow-lg">
          Send Message
        </button>
      </form>
    </div>
  );
}
