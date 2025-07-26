import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// --- Helper Components (Icons) ---
const SendIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const BotIcon = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  </div>
);

const UserIcon = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  </div>
);

const MicIcon = ({ isListening }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 ${isListening ? 'text-red-400' : 'text-white'}`} fill="currentColor">
    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
  </svg>
);

const VideoIcon = ({ isVideoOn }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 ${isVideoOn ? 'text-green-400' : 'text-red-400'}`} fill="currentColor">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);

// --- Face Scan Overlay Component ---
const FaceScanOverlay = ({ movementPercentage }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="relative w-48 h-48 sm:w-64 sm:h-64">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.2 } }}
        className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.4 } }}
        className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.6 } }}
        className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.8 } }}
        className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg"
      />
      <motion.div
        className="absolute left-0 w-full h-1 bg-cyan-400/70"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute top-4 left-4 bg-black/70 text-white text-sm font-semibold px-2 py-1 rounded-lg shadow-md">
        Movement: {movementPercentage.toFixed(0)}%
      </div>
    </div>
  </div>
);

// --- Browser API Check ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
}

// --- Roles and Tech Stacks ---
const rolesAndStacks = {
  "Frontend Developer": ["React", "Angular", "Vue.js", "Svelte"],
  "Backend Developer": ["Node.js (Express)", "Python (Django)", "Java (Spring)", "Go", "Rust"],
  "Full Stack Developer": ["MERN", "MEAN", "MEVN", ".NET Core + React"],
  "Data Scientist": ["Python (Pandas, NumPy)", "R", "SQL", "Machine Learning Concepts"],
  "QA Engineer": ["Selenium", "Cypress", "Playwright", "Manual Testing Concepts"],
  "DevOps Engineer": ["AWS", "Docker & Kubernetes", "Terraform", "CI/CD Pipelines"]
};

export default function InterviewPage() {
  // State
  const { user, logout } = useAuth();
  const [role, setRole] = useState('');
  const [techStack, setTechStack] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [interviewId, setInterviewId] = useState(null);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [movementPercentage, setMovementPercentage] = useState(0);

  // Refs
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const prevFrameRef = useRef(null);
  const navigate = useNavigate();

  // --- Handlers ---
  const handleLogout = () => {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    if (recognition && recognition.stop) recognition.stop(); // Stop speech recognition
    setIsListening(false);
    setIsUserTurn(false);
    logout();
    navigate('/login');
  };

  // --- Effects ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let stream;
    if (interviewStarted && isVideoOn) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(str => {
          stream = str;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => {
          setError("Could not access camera. Please check permissions.");
        });
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [interviewStarted, isVideoOn]);

  useEffect(() => {
    if (interviewStarted && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [interviewStarted, startTime]);

  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setIsListening(false);
      setTimeout(() => {
        document.getElementById('message-form')?.requestSubmit();
      }, 100);
    };
    recognition.onerror = (event) => {
      setError("Speech recognition error. Please try again.");
      setIsListening(false);
      setIsUserTurn(true);
    };
    recognition.onend = () => setIsListening(false);
  }, []);

  // Face Movement Detection
  useEffect(() => {
    if (!interviewStarted || !isVideoOn || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastUpdate = 0;
    const updateInterval = 100;

    const detectMovement = () => {
      const now = Date.now();
      if (now - lastUpdate < updateInterval) {
        requestAnimationFrame(detectMovement);
        return;
      }
      lastUpdate = now;

      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        canvas.width = videoRef.current.videoWidth / 2;
        canvas.height = videoRef.current.videoHeight / 2;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (!prevFrameRef.current) {
          prevFrameRef.current = new ImageData(new Uint8ClampedArray(currentFrame.data), canvas.width, canvas.height);
          setMovementPercentage(0);
        } else {
          let diffCount = 0;
          const totalPixels = currentFrame.data.length / 4;
          for (let i = 0; i < currentFrame.data.length; i += 4) {
            const rDiff = Math.abs(currentFrame.data[i] - prevFrameRef.current.data[i]);
            const gDiff = Math.abs(currentFrame.data[i + 1] - prevFrameRef.current.data[i + 1]);
            const bDiff = Math.abs(currentFrame.data[i + 2] - prevFrameRef.current.data[i + 2]);
            if (rDiff > 20 || gDiff > 20 || bDiff > 20) diffCount++;
          }
          const percentage = (diffCount / totalPixels) * 100;
          setMovementPercentage(Math.min(100, Math.max(0, percentage)));
          prevFrameRef.current = new ImageData(new Uint8ClampedArray(currentFrame.data), canvas.width, canvas.height);
        }
      }
      requestAnimationFrame(detectMovement);
    };

    const animationFrameId = requestAnimationFrame(detectMovement);
    return () => cancelAnimationFrame(animationFrameId);
  }, [interviewStarted, isVideoOn]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsUserTurn(true);
    window.speechSynthesis.speak(utterance);
  };

  // --- API Calls ---
  const startInterview = async () => {
    if (!role || !techStack) {
      setError("Please select a role and tech stack.");
      return;
    }
    setIsLoading(true);
    const welcomeMessage = { 
      sender: 'ai', 
      text: `Hello ${user?.name || 'Candidate'}! I'll be your interviewer today for a ${role} position focusing on ${techStack}. Let's begin.`,
      timestamp: new Date() 
    };
    const savedInterview = await api('/api/interviews', 'POST', { role, techStack, messages: [welcomeMessage] });

    if (savedInterview) {
      setInterviewId(savedInterview._id);
      setMessages([welcomeMessage]);
      setInterviewStarted(true);
      setStartTime(Date.now());
      speak(welcomeMessage.text);

      const prompt = `You are a technical interviewer. Start an interview for a ${role} position on ${techStack}. Ask the first question.`;
      const firstQuestion = await api('/api/gemini/generate', 'POST', { prompt });

      if (firstQuestion?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiText = firstQuestion.candidates[0].content.parts[0].text;
        const updatedMessages = [...savedInterview.messages, { sender: 'ai', text: aiText, timestamp: new Date() }];
        setMessages(updatedMessages);
        await api(`/api/interviews/${savedInterview._id}`, 'PUT', { messages: updatedMessages });
      }
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isLoading || !interviewId) return;

    setIsLoading(true);
    setIsUserTurn(false);
    const userMessage = { sender: 'user', text: userInput, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setUserInput('');
    await api(`/api/interviews/${interviewId}`, 'PUT', { messages: updatedMessages });

    const conversationHistory = updatedMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `This is a technical interview. Here is the transcript so far:\n${conversationHistory}\n\nBased on the candidate's last answer, ask the next single, relevant technical question.`;
    const nextQuestion = await api('/api/gemini/generate', 'POST', { prompt });

    if (nextQuestion?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiText = nextQuestion.candidates[0].content.parts[0].text;
      speak(aiText);
      const finalMessages = [...updatedMessages, { sender: 'ai', text: aiText, timestamp: new Date() }];
      setMessages(finalMessages);
      await api(`/api/interviews/${interviewId}`, 'PUT', { messages: finalMessages });
    }
    setIsLoading(false);
  };

  const endInterview = async () => {
    if (!interviewId) return;
    window.speechSynthesis.cancel();
    setIsLoading(true);
    setIsUserTurn(false);
    const endMessage = { sender: 'ai', text: "Thank you for your time. I'm now generating your feedback...", timestamp: new Date() };
    setMessages(prev => [...prev, endMessage]);

    const conversationHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `The interview is over. Here is the transcript:\n${conversationHistory}\n\nProvide a detailed performance review in Markdown format. Cover technical knowledge, problem-solving skills, and communication. Include strengths, weaknesses, and areas for improvement.`;
    const finalFeedback = await api('/api/gemini/generate', 'POST', { prompt });

    if (finalFeedback?.candidates?.[0]?.content?.parts?.[0]?.text) {
      setFeedback(finalFeedback.candidates[0].content.parts[0].text);
      await api(`/api/interviews/${interviewId}`, 'PUT', { feedback: finalFeedback.candidates[0].content.parts[0].text });
    }
    setIsLoading(false);
    setInterviewStarted(false);
    setIsVideoOn(false);
    setElapsedTime(0);
  };

  const restartInterview = () => {
    setRole('');
    setTechStack('');
    setInterviewStarted(false);
    setMessages([]);
    setUserInput('');
    setIsLoading(false);
    setFeedback(null);
    setInterviewId(null);
    setError('');
    setIsVideoOn(true);
    setElapsedTime(0);
    setStartTime(null);
    setIsUserTurn(false);
    setMovementPercentage(0);
  };

  const toggleListening = () => {
    if (!recognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsUserTurn(false);
      recognition.start();
      setIsListening(true);
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(prev => !prev);
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-gray-900"
      style={{ backgroundImage: 'linear-gradient(to bottom right, #0a032c, #1a0a4a, #0a032c)' }}
    >
      <div className="w-full max-w-4xl h-[90vh] text-white flex flex-col">
        <AnimatePresence>
          {feedback ? (
            <motion.div
              key="feedback"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
            >
              <motion.div
                className="bg-gray-800 p-6 sm:p-8 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Interview Feedback</h2>
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
                  {isLoading ? (
                    <p className="text-center text-indigo-200">Generating your feedback...</p>
                  ) : (
                    <ReactMarkdown>{feedback}</ReactMarkdown>
                  )}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(feedback)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                  >
                    Copy Feedback
                  </button>
                  <button
                    onClick={restartInterview}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                  >
                    Start New Interview
                  </button>
                </div>
              </motion.div>
            </motion.div>
          ) : interviewStarted ? (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full flex flex-col md:flex-row gap-4 sm:gap-6"
            >
              <div className="w-full md:w-2/3 h-[60vh] md:h-full flex flex-col bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 overflow-hidden">
                <div className="p-4 border-b border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h2 className="text-lg sm:text-xl font-bold">
                    {role} - {techStack} - {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={endInterview}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                    >
                      End Interview
                    </button>
                    <button
                      onClick={handleLogout}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                    >
                      Logout
                    </button>
                  </div>
                </div>
                <div className="flex-grow p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-800">
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: msg.sender === 'user' ? 100 : -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'ai' && <BotIcon />}
                        <div
                          className={`max-w-[85%] sm:max-w-md lg:max-w-xl px-4 py-3 rounded-lg ${
                            msg.sender === 'ai' ? 'bg-indigo-900/70 rounded-bl-none' : 'bg-blue-800/70 rounded-br-none'
                          }`}
                        >
                          <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.text}</p>
                          {msg.timestamp && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                        {msg.sender === 'user' && <UserIcon />}
                      </motion.div>
                    ))}
                    {isLoading && !isListening && (
                      <div className="flex items-start gap-3">
                        <BotIcon />
                        <div className="px-4 py-3 rounded-lg bg-indigo-900/70">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" />
                            <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:0.2s]" />
                            <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>
                <div className="p-4 border-t border-white/20">
                  {error && (
                    <div className="bg-red-500/50 p-2 rounded-lg mb-3 text-center text-sm">{error}</div>
                  )}
                  <form id="message-form" onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder={isListening ? "Listening..." : "Type your answer or click the mic"}
                      className="flex-grow bg-white/10 p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-indigo-400 focus:outline-none text-sm sm:text-base"
                      disabled={isLoading || isListening}
                    />
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        isUserTurn ? 'bg-blue-600 animate-pulse' : 'bg-indigo-600/50'
                      } hover:bg-indigo-700/70 disabled:bg-indigo-900/50`}
                      disabled={isLoading}
                    >
                      <MicIcon isListening={isListening} />
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !userInput.trim()}
                      className="bg-indigo-600 p-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 transition-all duration-300"
                    >
                      <SendIcon />
                    </button>
                  </form>
                  {isUserTurn && !isListening && (
                    <p className="text-center text-blue-300 mt-2 text-sm animate-pulse">
                      Your turn. Click the mic to speak or type your answer.
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full md:w-1/3 h-[40vh] md:h-full bg-black rounded-lg overflow-hidden border border-white/20 flex flex-col items-center justify-center relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                  style={{ display: isVideoOn ? 'block' : 'none' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {isVideoOn && <FaceScanOverlay movementPercentage={movementPercentage} />}
                {!isVideoOn && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <p className="text-gray-400 text-sm sm:text-base">Video is off</p>
                  </div>
                )}
                <button
                  onClick={toggleVideo}
                  className="absolute bottom-4 bg-black/50 p-2 rounded-full hover:bg-black/80 transition-all duration-300"
                >
                  <VideoIcon isVideoOn={isVideoOn} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md sm:max-w-lg mx-auto p-6 sm:p-8 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20"
            >
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">AI Interviewer</h1>
                <div className="flex items-center gap-3">
                  <Link
                    to="/dashboard"
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-300"
                  >
                    My History
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-300"
                  >
                    Logout
                  </button>
                </div>
              </div>
              <p className="text-center text-indigo-200 mb-6 sm:mb-8 text-sm sm:text-base">
                Welcome, <span className="font-semibold">{user?.name || 'Candidate'}!</span> Prepare for your next tech interview.
              </p>
              {error && (
                <div className="bg-red-500/50 text-white p-3 rounded-lg mb-4 text-center text-sm">{error}</div>
              )}
              <div className="space-y-6">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-indigo-100 mb-2">
                    Select Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setTechStack('');
                    }}
                    className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                  >
                    <option value="">Choose a role...</option>
                    {Object.keys(rolesAndStacks).map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                {role && (
                  <div>
                    <label htmlFor="tech" className="block text-sm font-medium text-indigo-100 mb-2">
                      Select Tech Stack
                    </label>
                    <select
                      id="tech"
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                      className="w-full bg-white/10 text-white p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                    >
                      <option value="">Choose a tech stack...</option>
                      {rolesAndStacks[role].map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={startInterview}
                  disabled={isLoading || !role || !techStack}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isLoading ? 'Preparing...' : 'Start Interview'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}