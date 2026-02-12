import React from "react";

const Login = ({ onLogin }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-3 h-3 bg-blue-500 rotate-45"></div>
                    <h1 className="text-xl font-bold text-white">InterviewAgent</h1>
                </div>
        
                <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
                <p className="text-slate-400 mb-8">Sign in to continue your practice.</p>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="name@company.com" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input type="password" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="••••••••" required />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-600/20 transition-all">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;