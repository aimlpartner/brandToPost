import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Feedback } from '../types';
import { Send, User, Clock, MessageSquare } from 'lucide-react';
import { logSilentError } from '../lib/firestore-error';

interface PostFeedbackProps {
 campaignId: string;
 postId: string;
 feedbacks: Feedback[];
 reviewerId: string;
 reviewerName: string;
 timerExpired: boolean;
 onRequireName: () => void;
}

export function PostFeedback({ campaignId, postId, feedbacks, reviewerId, reviewerName, timerExpired, onRequireName }: PostFeedbackProps) {
 const [newFeedback, setNewFeedback] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);

 const postFeedbacks = feedbacks.filter(f => f.postId === postId);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newFeedback.trim() || timerExpired) return;

 if (!reviewerName) {
 onRequireName();
 return;
 }

 setIsSubmitting(true);
 try {
 await addDoc(collection(db, `campaigns/${campaignId}/feedbacks`), {
 campaignId,
 postId,
 reviewerId,
 reviewerName,
 content: newFeedback.trim(),
 timestamp: new Date().toISOString()
 });
 setNewFeedback('');
 } catch (err) {
 logSilentError(err as Error, { context: "submitFeedback", campaignId, postId });
 alert("Failed to submit feedback. Please try again.");
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="mt-4 pt-4 border-t border-[#7C3AED]/20/50">
 <h5 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
 <MessageSquare className="h-4 w-4" />
 Feedback
 </h5>
 
 {postFeedbacks.length > 0 && (
 <div className="space-y-3 mb-4">
 {postFeedbacks.map(feedback => (
 <div key={feedback.id} className="bg-[#1C1C22]/50 rounded-lg p-3 text-sm border border-[#7C3AED]/20">
 <div className="flex items-center justify-between mb-1">
 <span className="font-medium text-gray-100 flex items-center gap-1.5">
 <User className="h-3 w-3 text-gray-400" />
 {feedback.reviewerName}
 </span>
 <span className="text-xs text-gray-300 flex items-center gap-1">
 <Clock className="h-3 w-3" />
 {new Date(feedback.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 <p className="text-gray-300 whitespace-pre-wrap">{feedback.content}</p>
 </div>
 ))}
 </div>
 )}

 {!timerExpired ? (
 <form onSubmit={handleSubmit} className="relative">
 <textarea
 value={newFeedback}
 onChange={(e) => setNewFeedback(e.target.value)}
 placeholder="Add feedback for this post..."
 className="w-full bg-[#1C1C22]/50 border border-[#7C3AED]/20 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 resize-none min-h-[60px]"
 disabled={isSubmitting}
 />
 <button
 type="submit"
 disabled={!newFeedback.trim() || isSubmitting}
 className="absolute right-2 bottom-2 p-1.5 text-gray-300 hover:text-[#ff6347] disabled:opacity-50 transition-colors"
 >
 <Send className="h-4 w-4" />
 </button>
 </form>
 ) : (
 <div className="bg-[#1C1C22]/50 rounded-lg p-3 text-sm text-gray-400 text-center italic border border-[#7C3AED]/20">
 Feedback period has ended.
 </div>
 )}
 </div>
 );
}
