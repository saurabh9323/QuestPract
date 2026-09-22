'use client';

import {useEffect, useRef, useState} from 'react';
import {localGet, localSet} from '@/lib/local-db';
import {useStudio} from './StudioContext';

type Clip = {id: string; at: string; blob: Blob; seconds: number};

export default function VoiceRecorder() {
  const {userKey, notice} = useStudio();
  const [clips, setClips] = useState<Clip[]>([]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [ready, setReady] = useState(false);
  const media = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alive = useRef(true);
  const writing = useRef(false);
  const currentClips = useRef(clips);
  currentClips.current = clips;
  const key = `studio-audio:${userKey}`;

  useEffect(() => {
    alive.current = true;
    setReady(!!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined');
    localGet<Clip[]>(key).then(rows => {
      if (alive.current) setClips((rows || []).filter(c => c.blob instanceof Blob));
    }).catch(() => notice('Local recordings could not be loaded.'))
      .finally(() => { if (alive.current) setLoading(false); });
    return () => {
      alive.current = false;
      if (timer.current) clearInterval(timer.current);
      if (media.current?.state === 'recording') media.current.stop();
      stream.current?.getTracks().forEach(t => t.stop());
    };
  }, [key, notice]);

  const [urls, setUrls] = useState<(Clip & {url: string})[]>([]);
  useEffect(() => {
    const next = clips.map(c => ({...c, url: URL.createObjectURL(c.blob)}));
    setUrls(next);
    return () => next.forEach(c => URL.revokeObjectURL(c.url));
  }, [clips]);

  async function start() {
    if (loading || writing.current || recording || clips.length >= 10) return;
    writing.current = true;
    setLoading(true);
    try {
      const mic = await navigator.mediaDevices.getUserMedia({audio: true});
      if (!alive.current) { mic.getTracks().forEach(t => t.stop()); return; }
      stream.current = mic;
      const recorder = new MediaRecorder(mic);
      const chunks: BlobPart[] = [];
      const started = Date.now();
      let failed = false;
      media.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        if (timer.current) clearInterval(timer.current);
        mic.getTracks().forEach(t => t.stop());
        if (!alive.current) return;
        writing.current = true;
        setLoading(true);
        setRecording(false);
        try {
          if (failed) return;
          const blob = new Blob(chunks, {type: recorder.mimeType});
          if (!blob.size || blob.size > 5_000_000) {
            notice('Recording is empty or exceeds 5 MB. Try a shorter recording.');
            return;
          }
          const clip = {id: crypto.randomUUID(), at: new Date().toISOString(), blob,
            seconds: Math.round((Date.now() - started) / 1000)};
          const next = [clip, ...currentClips.current];
          await localSet(key, next);
          if (alive.current) { currentClips.current = next; setClips(next); notice('Recording saved on this device.'); }
        } catch {
          notice('Recording could not be saved on this device. Check browser storage.');
        } finally {
          writing.current = false;
          if (alive.current) setLoading(false);
        }
      };
      recorder.onerror = () => {
        failed = true;
        mic.getTracks().forEach(t => t.stop());
        if (timer.current) clearInterval(timer.current);
        if (alive.current) { setRecording(false); notice('Recording failed. Check microphone permissions.'); }
      };
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - started) / 1000);
        setSeconds(elapsed);
        if (elapsed >= 60 && recorder.state === 'recording') recorder.stop();
      }, 250);
    } catch {
      stream.current?.getTracks().forEach(t => t.stop());
      notice('Microphone unavailable or permission denied. You can still write and practise your answer.');
    } finally {
      writing.current = false;
      if (alive.current) setLoading(false);
    }
  }

  return <section className="card">
    <h3>60-second speaking recorder</h3>
    <p>Record, listen, and repeat. Audio stays on this device under your account; it is not uploaded or automatically graded. Download a copy to keep it elsewhere.</p>
    <p>Stop and wait for “Recording saved” before leaving this tool. An unfinished recording is discarded when you leave.</p>
    <div className="button-row">
      <button className="primary" disabled={!ready || loading || (!recording && clips.length >= 10)}
        onClick={recording ? () => {if (media.current?.state === 'recording') media.current.stop();} : () => void start()}>
        {recording ? `Stop · ${seconds}s` : loading ? 'Loading / saving…' : 'Start recording'}
      </button>
      <span>{clips.length}/10 local recordings</span>
    </div>
    {!ready && <small>Microphone recording requires a supported browser and HTTPS or localhost.</small>}
    {urls.map(c => <div className="studio-recording" key={c.id}>
      <small>{new Date(c.at).toLocaleString()} · {c.seconds}s</small>
      <audio controls src={c.url}/>
      <a className="secondary" href={c.url} download={`speaking-${c.id}.${c.blob.type.includes('mp4') ? 'mp4' : c.blob.type.includes('ogg') ? 'ogg' : 'webm'}`}>Download</a>
      <button className="secondary" disabled={recording || loading} onClick={async () => {
        if (writing.current) return;
        writing.current = true;
        setLoading(true);
        try {
          const next = currentClips.current.filter(x => x.id !== c.id);
          await localSet(key, next);
          if (alive.current) { currentClips.current = next; setClips(next); }
        } catch { notice('Could not delete this recording.'); }
        finally { writing.current = false; if (alive.current) setLoading(false); }
      }}>Delete</button>
    </div>)}
  </section>;
}
