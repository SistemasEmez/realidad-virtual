'use client';

import {useEffect, useRef, useState} from 'react';

type LogoPreviewProps = {
  name: string;
  model: string;
  modelName: string;
  rx: number;
  ry: number;
  rz: number;
};

export default function ExperiencePreview(props: LogoPreviewProps) {
  const container = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [visible, setVisible] = useState(false);
  // Frame each logo at a useful thumbnail size, independently of its AR scale.
  const config = useRef({...props, scale: 1000, spin: false});
  config.current = {...props, scale: 1000, spin: false};

  function sync() {
    frame.current?.contentWindow?.postMessage({type: 'config', config: config.current}, location.origin);
  }

  useEffect(() => {
    if (!container.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {rootMargin: '150px'});
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin === location.origin && event.source === frame.current?.contentWindow && event.data.type === 'ready') sync();
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => { sync(); }, [props.model, props.modelName, props.rx, props.ry, props.rz, visible]);

  return <div ref={container} className="experience-logo-preview">
    {visible && <iframe
      ref={frame}
      src="/preview.html?thumbnail=1"
      title={'Logo 3D de ' + props.name}
      onLoad={sync}
      tabIndex={-1}
    />}
  </div>;
}
