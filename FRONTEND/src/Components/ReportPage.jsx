import React from 'react';
const ReportPage=({data,onGoHome})=>{
    const report={
        overall_score:data?.overall_score ?? data?.overallScore ?? null,
        summary:data?.summary ?? "No summary available.",
        strengths:Array.isArray(data?.strengths) ? data.strengths : [],
        weaknesses:Array.isArray(data?.weaknesses) ? data.weaknesses : [],
        verdict:data?.verdict ?? "Pending"
    };
    return(
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Interview Report</h1>
                <p className="text-slate-400 mb-8">Here is how you performed.</p>

                <div className="bg-slate-800 rounded-xl p-6 mb-6 flex flex-col items-center">
                    <span className="text-slate-400 text-sm uppercase tracking-wider">Overall Score</span>
                    <span className="text-6xl font-bold text-blue-400 mt-2">{report.overall_score ?? "N/A"}{report.overall_score !== null ? "/10" : ""}</span>
                </div>

                <div className="text-left space-y-4 mb-8">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                        <p className="text-slate-300 bg-slate-800 p-4 rounded-lg">{report.summary}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-green-400 font-semibold mb-2">Strengths</h3>
                            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                                {report.strengths.length > 0 ? report.strengths.map((s, i) => <li key={i}>{s}</li>) : <li>No strengths captured.</li>}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-red-400 font-semibold mb-2">Areas to Improve</h3>
                            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                                {report.weaknesses.length > 0 ? report.weaknesses.map((w, i) => <li key={i}>{w}</li>) : <li>No weaknesses captured.</li>}
                            </ul>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Verdict</h3>
                        <p className="text-slate-300 bg-slate-800 p-4 rounded-lg">{report.verdict}</p>
                    </div>
                </div>
                <button
                onClick={onGoHome}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};
export default ReportPage;
