'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExperienceStore } from '@/store/useExperienceStore';
import { submitWebsiteV2Submission } from '@/lib/api/submissions';

type FormStatus =
  | 'idle'
  | 'typing'
  | 'validation_error'
  | 'submitting'
  | 'success'
  | 'failure';

interface FormErrors {
  message?: string;
  email?: string;
  submit?: string;
}

export default function Overlay() {
  const { scene, setScene } = useExperienceStore();
  const [reflection, setReflection] = useState('');
  const [wantsFeedback, setWantsFeedback] = useState(false);
  const [email, setEmail] = useState('');
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errors, setErrors] = useState<FormErrors>({});

  // Auto-start opening sequence
  useEffect(() => {
    if (scene === 'loading') {
      // Simulate brief loading
      const t = setTimeout(() => setScene('opening'), 1000);
      return () => clearTimeout(t);
    }
  }, [scene, setScene]);

  // Opening sequence timing
  useEffect(() => {
    if (scene === 'opening') {
      const t = setTimeout(() => {
        setScene('heart');
      }, 6000); // 3s fade in/stay + 3s fade out
      return () => clearTimeout(t);
    }
  }, [scene, setScene]);

  // Outro sequence timing
  useEffect(() => {
    if (scene === 'outro') {
      const t = setTimeout(() => {
        setScene('stillness');
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [scene, setScene]);

  useEffect(() => {
    if (scene !== 'reflection' || formStatus !== 'success') return;
    const t = setTimeout(() => setScene('outro'), 2200);
    return () => clearTimeout(t);
  }, [formStatus, scene, setScene]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    if (!reflection.trim()) {
      nextErrors.message = 'Write at least one honest line.';
    }

    if (wantsFeedback) {
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        nextErrors.email = 'Email is needed only if you ask for feedback.';
      } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        nextErrors.email = 'Use a valid email address.';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStatus === 'submitting') return;

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormStatus('validation_error');
      return;
    }

    setErrors({});
    setFormStatus('submitting');

    const result = await submitWebsiteV2Submission({
      message: reflection.trim(),
      isAnonymous: true,
      wantsFeedback,
      email: wantsFeedback ? email.trim() : '',
      source: 'website-v2',
    });

    if (result.success) {
      setFormStatus('success');
      return;
    }

    setErrors({
      submit: result.error || 'The mirror stayed silent. Try again.',
    });
    setFormStatus('failure');
  };

  const markTyping = () => {
    if (formStatus === 'submitting' || formStatus === 'success') return;
    if (errors.message || errors.email || errors.submit) {
      setErrors({});
    }
    setFormStatus('typing');
  };

  const handleFeedbackToggle = (checked: boolean) => {
    setWantsFeedback(checked);
    if (!checked) {
      setEmail('');
    }
    markTyping();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center">
      <AnimatePresence mode="wait">
        
        {/* SCENE 1: Opening Question */}
        {scene === 'opening' && (
          <motion.div
            key="opening"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 3, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
          >
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl max-w-4xl leading-snug tracking-wide text-white/90">
              If you were aware of the day you will die, what would you do now?
            </h1>
          </motion.div>
        )}

        {/* SCENE 3: Reflection Prompt */}
        {scene === 'reflection' && (
          <motion.div
            key="reflection"
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-sm px-4"
          >
            <div className="w-full max-w-lg p-8 md:p-12 border border-white/5 bg-[#050505]/80 backdrop-blur-md shadow-2xl">
              {formStatus === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  className="min-h-72 flex items-center justify-center text-center"
                >
                  <p className="font-serif text-2xl md:text-3xl leading-snug text-white/90">
                    See you on the other side of the mirror.
                  </p>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-serif text-2xl md:text-3xl mb-8 text-center text-white/90">
                    What are you doing now?
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6 font-sans" noValidate>
                    <div>
                      <label htmlFor="reflection" className="sr-only">
                        Reflection message
                      </label>
                      <textarea
                        id="reflection"
                        required
                        value={reflection}
                        onChange={(e) => {
                          setReflection(e.target.value);
                          markTyping();
                        }}
                        placeholder="Write your reflection..."
                        disabled={formStatus === 'submitting'}
                        aria-invalid={Boolean(errors.message)}
                        className="w-full h-32 bg-transparent border-b border-white/20 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/60 resize-none transition-colors text-sm md:text-base disabled:opacity-60"
                      />
                      {errors.message && (
                        <p className="mt-2 text-xs tracking-wide text-red-300/80">{errors.message}</p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 border border-white/30 group-hover:border-white/60 transition-colors">
                          <input
                            type="checkbox"
                            checked={wantsFeedback}
                            onChange={(e) => handleFeedbackToggle(e.target.checked)}
                            disabled={formStatus === 'submitting'}
                            className="sr-only"
                          />
                          {wantsFeedback && <div className="w-3 h-3 bg-white/80" />}
                        </div>
                        <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                          I want feedback
                        </span>
                      </label>
                    </div>

                    <AnimatePresence>
                      {wantsFeedback && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <label htmlFor="feedback-email" className="sr-only">
                            Feedback email
                          </label>
                          <input
                            id="feedback-email"
                            type="email"
                            required={wantsFeedback}
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              markTyping();
                            }}
                            placeholder="Enter your email"
                            disabled={formStatus === 'submitting'}
                            aria-invalid={Boolean(errors.email)}
                            className="w-full bg-transparent border-b border-white/20 text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/60 py-2 text-sm transition-colors mt-2 disabled:opacity-60"
                          />
                          {errors.email && (
                            <p className="mt-2 text-xs tracking-wide text-red-300/80">{errors.email}</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {errors.submit && (
                        <motion.p
                          key="submit-error"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-xs tracking-wide text-red-300/80"
                        >
                          {errors.submit}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <div className="pt-6 flex justify-center">
                      <button
                        type="submit"
                        disabled={formStatus === 'submitting'}
                        className="px-8 py-3 text-sm tracking-widest uppercase border border-white/20 text-white/60 hover:text-white hover:border-white/60 transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {formStatus === 'submitting' ? 'Submitting...' : 'Submit'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* SCENE 4: Outro Message */}
        {scene === 'outro' && (
          <motion.div
            key="outro"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 3, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
          >
            <h1 className="font-serif text-2xl md:text-4xl lg:text-5xl max-w-3xl leading-snug tracking-wide text-white/90">
              See you on the other side of the mirror.
            </h1>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}