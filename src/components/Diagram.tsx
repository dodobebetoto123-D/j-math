"use client";

import { Mermaid } from "react-mermaid";

interface DiagramProps {
  chart: string;
}

export default function Diagram({ chart }: DiagramProps) {
  // Mermaid 컴포넌트에 key를 전달하여, chart 내용이 바뀔 때마다 컴포넌트가 재생성되도록 합니다.
  return <Mermaid chart={chart} key={chart} />;
}