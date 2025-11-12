import React from "react";
import HallOfFame from "./components/hof/HallOfFame"; // <- fix path (and drop extension)

// Super-thin error boundary so runtime errors don't leave a blank page
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { err: undefined };
  }
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error, info: any) { console.error("App ErrorBoundary caught:", err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 16, color: "#b00020", background: "#fff1f2", fontFamily: "system-ui, sans-serif" }}>
          <h3 style={{ margin: 0 }}>Something went wrong.</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.err?.message || this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const App: React.FC = () => (
  <ErrorBoundary>
    <HallOfFame />
  </ErrorBoundary>
);

export default App;
