import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api('/api/interviews/history');
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center text-white">Loading history...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-900 text-white p-8"
      style={{ backgroundImage: 'linear-gradient(to bottom right, #0a032c, #1a0a4a, #0a032c)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Interview History</h1>
          <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
            New Interview
          </Link>
        </div>
        {history.length === 0 ? (
          <p>You have no completed interviews yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map(interview => (
              <motion.div
                key={interview._id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white/10 p-4 rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="text-xl font-semibold">{interview.role}</h3>
                  <p className="text-gray-400">{interview.techStack}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(interview.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFeedback(interview.feedback)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                  disabled={!interview.feedback}
                >
                  {interview.feedback ? 'View Feedback' : 'No Feedback'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedFeedback(null)}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 p-6 rounded-lg max-w-2xl w-full"
            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <h2 className="text-2xl font-bold mb-4">Interview Feedback</h2>
            <div className="prose prose-invert max-h-[60vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: selectedFeedback.replace(/\n/g, '<br />') }} />
            <button onClick={() => setSelectedFeedback(null)} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
              Close
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}