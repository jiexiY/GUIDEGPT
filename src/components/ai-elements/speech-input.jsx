"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { MicIcon, SquareIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const detectSpeechInputMode = () => {
  if (typeof window === "undefined") {
    return "none";
  }

  if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    return "speech-recognition";
  }

  if ("MediaRecorder" in window && "mediaDevices" in navigator) {
    return "media-recorder";
  }

  return "none";
};

export const SpeechInput = ({
  className,
  onTranscriptionChange,
  onAudioRecorded,
  onListeningChange,
  onError,
  lang = "en-US",
  disabled = false,
  ...props
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode] = useState(detectSpeechInputMode);
  const [isRecognitionReady, setIsRecognitionReady] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const startingRef = useRef(false);
  const disposedRef = useRef(false);
  const onTranscriptionChangeRef = useRef(onTranscriptionChange);
  const onAudioRecordedRef =
    useRef(onAudioRecorded);
  const onErrorRef = useRef(onError);

  // Keep refs in sync
  onTranscriptionChangeRef.current = onTranscriptionChange;
  onAudioRecordedRef.current = onAudioRecorded;
  onErrorRef.current = onError;

  useEffect(() => {
    onListeningChange?.({
      available: mode === "speech-recognition" || (mode === "media-recorder" && Boolean(onAudioRecorded)),
      isListening,
      isProcessing: isProcessing || isStarting,
      mode,
    });
  }, [isListening, isProcessing, isStarting, mode, onAudioRecorded, onListeningChange]);

  // Initialize Speech Recognition when mode is speech-recognition
  useEffect(() => {
    if (mode !== "speech-recognition") {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechRecognition = new SpeechRecognition();
    setIsListening(false);

    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = lang;

    const handleStart = () => {
      startingRef.current = false;
      setIsStarting(false);
      setIsListening(true);
    };

    const handleEnd = () => {
      startingRef.current = false;
      setIsStarting(false);
      setIsListening(false);
    };

    const handleResult = (event) => {
      const speechEvent = event;
      let finalTranscript = "";

      for (
        let i = speechEvent.resultIndex;
        i < speechEvent.results.length;
        i += 1
      ) {
        const result = speechEvent.results[i];
        if (result.isFinal) {
          finalTranscript += result[0]?.transcript ?? "";
        }
      }

      if (finalTranscript) {
        onTranscriptionChangeRef.current?.(finalTranscript);
      }
    };

    const handleError = (event) => {
      startingRef.current = false;
      setIsStarting(false);
      setIsListening(false);
      onErrorRef.current?.(event?.error || "recognition-error");
    };

    speechRecognition.addEventListener("start", handleStart);
    speechRecognition.addEventListener("end", handleEnd);
    speechRecognition.addEventListener("result", handleResult);
    speechRecognition.addEventListener("error", handleError);

    recognitionRef.current = speechRecognition;
    setIsRecognitionReady(true);

    return () => {
      speechRecognition.removeEventListener("start", handleStart);
      speechRecognition.removeEventListener("end", handleEnd);
      speechRecognition.removeEventListener("result", handleResult);
      speechRecognition.removeEventListener("error", handleError);
      startingRef.current = false;
      try {
        speechRecognition.stop();
      } catch {
        // Recognition may already be idle during a locale change or unmount.
      }
      recognitionRef.current = null;
      setIsRecognitionReady(false);
    };
  }, [mode, lang]);

  // Cleanup MediaRecorder and stream on unmount
  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      startingRef.current = false;
      if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    };
  }, []);

  // Start MediaRecorder recording
  const startMediaRecorder = useCallback(async () => {
    if (!onAudioRecordedRef.current || startingRef.current) {
      return;
    }

    startingRef.current = true;
    setIsStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposedRef.current) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      const handleDataAvailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      const handleStop = async () => {
        if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
        mediaRecorderRef.current = null;

        if (disposedRef.current) return;
        setIsListening(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || audioChunksRef.current[0]?.type || "audio/webm",
        });

        if (audioBlob.size > 0 && onAudioRecordedRef.current) {
          setIsProcessing(true);
          try {
            const transcript = await onAudioRecordedRef.current(audioBlob);
            if (!disposedRef.current && transcript) {
              onTranscriptionChangeRef.current?.(transcript);
            }
          } catch (error) {
            if (!disposedRef.current) {
              onErrorRef.current?.(error?.message || "transcription-error");
            }
          } finally {
            if (!disposedRef.current) setIsProcessing(false);
          }
        }
      };

      const handleError = (event) => {
        if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
        setIsListening(false);
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
        mediaRecorderRef.current = null;
        onErrorRef.current?.(event?.error?.name || "recording-error");
      };

      mediaRecorder.addEventListener("dataavailable", handleDataAvailable);
      mediaRecorder.addEventListener("stop", handleStop);
      mediaRecorder.addEventListener("error", handleError);

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      startingRef.current = false;
      setIsStarting(false);
      recordingTimerRef.current = window.setTimeout(() => {
        if (mediaRecorder.state === "recording") mediaRecorder.stop();
      }, 30_000);
      setIsListening(true);
    } catch (error) {
      if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
      }
      streamRef.current = null;
      mediaRecorderRef.current = null;
      if (!disposedRef.current) {
        setIsListening(false);
        onErrorRef.current?.(error?.name || "microphone-error");
      }
    } finally {
      startingRef.current = false;
      if (!disposedRef.current) setIsStarting(false);
    }
  }, []);

  // Stop MediaRecorder recording
  const stopMediaRecorder = useCallback(() => {
    if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = null;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!disabled) return;
    if (recognitionRef.current && (isListening || isStarting)) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may still be transitioning between states.
      }
    }
    if (mediaRecorderRef.current?.state === "recording") stopMediaRecorder();
  }, [disabled, isListening, isStarting, stopMediaRecorder]);

  const toggleListening = useCallback(() => {
    if (startingRef.current) return;

    if (mode === "speech-recognition" && recognitionRef.current) {
      if (isListening) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          onErrorRef.current?.(error?.name || "recognition-error");
        }
      } else {
        startingRef.current = true;
        setIsStarting(true);
        try {
          recognitionRef.current.start();
        } catch (error) {
          startingRef.current = false;
          setIsStarting(false);
          onErrorRef.current?.(error?.name || "recognition-error");
          setIsListening(false);
        }
      }
    } else if (mode === "media-recorder") {
      if (isListening) {
        stopMediaRecorder();
      } else {
        startMediaRecorder();
      }
    }
  }, [mode, isListening, startMediaRecorder, stopMediaRecorder]);

  // Determine if button should be disabled
  const isDisabled = disabled ||
    mode === "none" ||
    (mode === "speech-recognition" && !isRecognitionReady) ||
    (mode === "media-recorder" && !onAudioRecorded) ||
    isStarting ||
    isProcessing;

  const isBusy = isStarting || isProcessing;

  return (
    <div
      className="guide-speech-input"
      data-listening={isListening ? "true" : "false"}
      data-mode={mode}
      data-processing={isBusy ? "true" : "false"}
    >
      {/* Animated pulse rings */}
      {isListening &&
        [0, 1, 2].map((index) => (
          <span
            className="guide-speech-input__pulse"
            key={index}
            style={{
              animationDelay: `${index * 0.3}s`,
              animationDuration: "2s",
            }} />
        ))}
      {/* Main record button */}
      <Button
        {...props}
        type="button"
        aria-pressed={isListening}
        className={cn("guide-speech-input__button", isListening && "is-listening", className)}
        disabled={isDisabled}
        onClick={toggleListening}>
        {isBusy && <Spinner className="guide-speech-input__spinner" />}
        {!isBusy && isListening && <SquareIcon className="size-4" />}
        {!(isBusy || isListening) && <MicIcon className="size-4" />}
      </Button>
    </div>
  );
};
