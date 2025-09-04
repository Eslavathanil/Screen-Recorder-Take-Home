import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Square, Download, Video, Mic, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
  size: number;
}

export const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const { toast } = useToast();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 179) { // 3 minutes - 1 second
          stopRecording();
          return 180;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Combine streams
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      streamRef.current = combinedStream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        const recording: Recording = {
          id: Date.now().toString(),
          blob,
          url,
          duration: recordingTime,
          timestamp: new Date(),
          size: blob.size
        };

        setCurrentRecording(recording);
        setRecordings(prev => [recording, ...prev]);

        // Clean up streams
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();

      toast({
        title: "Recording started",
        description: "Screen recording has begun. Maximum duration: 3 minutes.",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not start screen recording. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [recordingTime, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();

      toast({
        title: "Recording stopped",
        description: "Your screen recording is ready for preview.",
      });
    }
  }, [isRecording, toast]);

  const downloadRecording = (recording: Recording) => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `screen-recording-${recording.timestamp.toISOString().slice(0, 19)}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Download started",
      description: "Your recording is being downloaded.",
    });
  };

  const togglePreview = () => {
    if (previewVideoRef.current) {
      if (isPreviewPlaying) {
        previewVideoRef.current.pause();
      } else {
        previewVideoRef.current.play();
      }
      setIsPreviewPlaying(!isPreviewPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-gradient-primary p-3 rounded-full">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
            Screen Recorder Pro
          </h1>
          <p className="text-muted-foreground text-lg">
            Record your screen with crystal clear audio in just one click
          </p>
        </div>

        {/* Main Recording Controls */}
        <Card className="p-8 bg-gradient-secondary border-border shadow-card">
          <div className="text-center space-y-6">
            {/* Timer */}
            <div className="text-6xl font-mono font-bold tracking-wide">
              <span className={isRecording ? 'text-recording-active animate-recording-pulse' : 'text-foreground'}>
                {formatTime(recordingTime)}
              </span>
              <span className="text-muted-foreground text-2xl ml-2">/ 03:00</span>
            </div>

            {/* Recording Button */}
            <div className="flex justify-center">
              {!isRecording ? (
                <Button 
                  onClick={startRecording}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-glow transition-all duration-300 px-8 py-6 text-lg font-semibold"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Start Recording
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="animate-pulse-glow px-8 py-6 text-lg font-semibold"
                >
                  <Square className="w-6 h-6 mr-3" />
                  Stop Recording
                </Button>
              )}
            </div>

            {/* Recording Status */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span>Screen Capture</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <span>Microphone</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Current Recording Preview */}
        {currentRecording && (
          <Card className="p-6 bg-card border-border shadow-card">
            <h3 className="text-xl font-semibold mb-4">Latest Recording</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={previewVideoRef}
                  src={currentRecording.url}
                  controls
                  className="w-full h-auto"
                  onPlay={() => setIsPreviewPlaying(true)}
                  onPause={() => setIsPreviewPlaying(false)}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-mono text-lg">{formatTime(currentRecording.duration)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">File Size</p>
                  <p className="font-mono text-lg">{formatFileSize(currentRecording.size)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">{currentRecording.timestamp.toLocaleString()}</p>
                </div>
                <Button 
                  onClick={() => downloadRecording(currentRecording)}
                  className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Recording
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Recording History */}
        {recordings.length > 1 && (
          <Card className="p-6 bg-card border-border shadow-card">
            <h3 className="text-xl font-semibold mb-4">Recording History</h3>
            <div className="space-y-3">
              {recordings.slice(1).map((recording) => (
                <div 
                  key={recording.id} 
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-accent transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <Video className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        Recording from {recording.timestamp.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(recording.duration)} • {formatFileSize(recording.size)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadRecording(recording)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};