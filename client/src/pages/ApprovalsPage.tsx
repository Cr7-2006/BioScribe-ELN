import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { Approval } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  FileCheck2,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Lock,
  FileSignature,
  AlertTriangle,
} from 'lucide-react';
import { formatDisplayDate, formatDisplayDateTime } from '../utils/date';

interface ApprovalsPageProps {
  onOpenExperiment: (id: string) => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({ onOpenExperiment }) => {
  const { user } = useAuth();
  const { success, error } = useNotification();

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  // E-Signature Signing Modal State
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [signingPassword, setSigningPassword] = useState('');
  const [signingReason, setSigningReason] = useState(
    'I have reviewed and approve this laboratory notebook record.'
  );
  const [signingComments, setSigningComments] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ approvals: Approval[] }>(
        `/approvals?status=${filterStatus}`
      );
      setApprovals(data.approvals);
    } catch (err: any) {
      error('Failed to load approvals', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [filterStatus]);

  const handleExecuteSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    if (!signingPassword) {
      error('Authentication Required', 'Password re-verification is required to authorize this signature.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiRequest(`/approvals/${selectedApproval.id}/sign`, {
        method: 'POST',
        body: JSON.stringify({
          password: signingPassword,
          decision,
          signatureReason: signingReason,
          comments: signingComments,
        }),
      });

      if (decision === 'approve') {
        success(
          'Electronic Signature Certified',
          `Digital signature executed. Digest: ${res.approval.signatureDigest.substring(0, 10)}...`
        );
      } else {
        success('Approval Rejected', 'Record returned to investigator for amendments.');
      }

      setSelectedApproval(null);
      fetchApprovals();
    } catch (err: any) {
      error('Signature Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <FileCheck2 className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Approvals & Electronic Signatures</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Compliant digital review pipeline with dual-factor identity verification and cryptographic locking.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-1 rounded-xl shadow-sm">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'pending'
                ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Pending Reviews
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'approved'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Executed Signatures
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Approvals List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading sign-off requests...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-500 space-y-3 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-300">No requests in this view</h3>
          <p className="text-xs text-slate-500">
            {filterStatus === 'pending'
              ? 'All laboratory notebook entries are currently reviewed and up to date.'
              : 'No sign-off records found for the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => {
            const isPending = appr.status === 'pending';

            return (
              <div
                key={appr.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-500/20">
                      {appr.experimentNumber}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                      Version {appr.versionNumber}
                    </span>
                    <span className="text-xs uppercase font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Role: {appr.role.replace('_', ' ')}
                    </span>
                    {appr.role === 'qa_compliance' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                        Signer: Dr. Subbu (QA)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                        Signer: Dr. Thameem (PI)
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize self-start sm:self-auto ${
                      appr.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                        : appr.status === 'pending'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
                        : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
                    }`}
                  >
                    Status: {appr.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 transition cursor-pointer" onClick={() => onOpenExperiment(appr.experimentId)}>
                    {appr.experimentTitle}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <strong>Intent:</strong> {appr.signatureReason}
                  </p>
                  {appr.comments && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <strong>Review Comments:</strong> {appr.comments}
                    </p>
                  )}
                </div>

                {/* Footer details & Signing Trigger */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div>
                    <span>Requested by: <strong className="text-slate-800 dark:text-slate-300 font-semibold">{appr.requesterName}</strong></span>
                    <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                    <span>Date: {formatDisplayDate(appr.createdAt)}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onOpenExperiment(appr.experimentId)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition flex items-center space-x-1 shadow-sm"
                    >
                      <span>Review Notebook</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    {isPending && (
                      <>
                        {appr.role === 'qa_compliance' ? (
                          user?.role === 'qa_manager' ? (
                            <button
                              onClick={() => {
                                setSelectedApproval(appr);
                                setDecision('approve');
                              }}
                              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
                            >
                              <FileSignature className="w-3.5 h-3.5" />
                              <span>Execute QA Compliance Release</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                              <span>Sent to QA Manager (Dr. Subbu) for Review</span>
                            </div>
                          )
                        ) : appr.role === 'peer_review' ? (
                          user?.role === 'reviewer' ? (
                            <button
                              onClick={() => {
                                setSelectedApproval(appr);
                                setDecision('approve');
                              }}
                              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                            >
                              <FileSignature className="w-3.5 h-3.5" />
                              <span>Execute Peer Review Signature</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                              <span>Sent to Reviewer (Dr. Thameem) for Review</span>
                            </div>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedApproval(appr);
                              setDecision('approve');
                            }}
                            className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-brand-500/20 cursor-pointer"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>Authorize & Execute Signature</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {appr.status === 'approved' && appr.signatureDigest && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>✓ Cryptographically Signed & Locked by {appr.reviewerName}</span>
                      <span>{formatDisplayDateTime(appr.signedAt)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Signature Digest: {appr.signatureDigest}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Electronic Signature Authorization Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Electronic Signature Authorization
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Executing legally binding digital attestation for {selectedApproval.experimentNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApproval(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Legal Statement */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>LEGAL CERTIFICATION NOTICE</span>
              </div>
              <p>
                "By executing this electronic signature, I certify that I have reviewed the notebook record, protocol steps, formulations, and raw observation logs, and attest to their authenticity and accuracy."
              </p>
            </div>

            <form onSubmit={handleExecuteSignature} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-600 dark:text-slate-400">Signer Identity: <strong className="text-slate-900 dark:text-white">{user?.name}</strong></div>
                <div className="text-slate-600 dark:text-slate-400">Signer Role: <strong className="text-brand-600 dark:text-brand-400 capitalize">{user?.role.replace('_', ' ')}</strong></div>
                <div className="text-slate-600 dark:text-slate-400">Department: <span className="text-slate-800 dark:text-slate-200">{user?.department}</span></div>
              </div>

              {/* Segregation of Duties Check */}
              {selectedApproval.role === 'qa_compliance' && user?.role !== 'qa_manager' && user?.role !== 'admin' && (
                 <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-500/40 text-purple-900 dark:text-purple-200 text-xs flex items-center space-x-2">
                   <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                   <span>
                     <strong>Segregation of Duties:</strong> This record has been sent to the QA Manager (Dr. Subbu) for review. Only authorized QA personnel can execute this release.
                   </span>
                 </div>
               )}

               {selectedApproval.role === 'peer_review' && user?.role !== 'reviewer' && user?.role !== 'admin' && (
                 <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-200 text-xs flex items-center space-x-2">
                   <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                   <span>
                     <strong>Segregation of Duties:</strong> This record has been sent to the designated Reviewer (Dr. Thameem) for peer review. Only authorized Reviewers can execute this sign-off.
                   </span>
                 </div>
               )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Review Decision *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      checked={decision === 'approve'}
                      onChange={() => setDecision('approve')}
                    />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Approve & Lock Record</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      checked={decision === 'reject'}
                      onChange={() => setDecision('reject')}
                    />
                    <span className="text-rose-600 dark:text-rose-400 font-bold">Reject & Request Amendments</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Intent / Reason for Signing *
                </label>
                <input
                  type="text"
                  value={signingReason}
                  onChange={(e) => setSigningReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Review Comments & Qualifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional review findings or notes..."
                  value={signingComments}
                  onChange={(e) => setSigningComments(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Dual Factor Authentication: Password Re-verification */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-slate-950 border border-amber-300 dark:border-amber-500/40 space-y-2">
                <label className="block text-amber-800 dark:text-amber-300 font-bold flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Dual Authentication: Re-enter Password *</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your password to certify signature"
                  value={signingPassword}
                  onChange={(e) => setSigningPassword(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500">
                  Password re-verification required to confirm user identity and authorize digital signature.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 font-medium"
                >
                  Cancel
                </button>
                {((selectedApproval.role === 'qa_compliance' && user?.role !== 'qa_manager' && user?.role !== 'admin') ||
                  (selectedApproval.role === 'peer_review' && user?.role !== 'reviewer' && user?.role !== 'admin')) ? (
                  <button
                    type="button"
                    disabled
                    className="px-5 py-2 rounded-xl font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-xs"
                  >
                    {selectedApproval.role === 'qa_compliance' ? 'Sent to QA for Review' : 'Sent to Reviewer for Review'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 rounded-xl font-bold text-slate-950 transition shadow-md ${
                      decision === 'approve'
                        ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                        : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20'
                    }`}
                  >
                    {isSubmitting ? 'Verifying...' : 'Sign & Certify Record'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
