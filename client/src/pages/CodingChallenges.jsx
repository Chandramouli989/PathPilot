import { useEffect, useMemo, useRef, useState } from "react";
import { Code2, Play, Send, ChevronLeft, Lightbulb, Trophy, Clock3, ShieldAlert } from "lucide-react";
import api from "../api/axios";

function runInSandbox(code, challenge) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("title", "Isolated JavaScript code runner");
    iframe.style.display = "none";
    const testPayload = JSON.stringify(challenge.tests);
    const functionName = JSON.stringify(challenge.functionName);
    const source = `<!doctype html><html><body><script>
      const send = (data) => parent.postMessage({ __pathpilotRunner: true, ...data }, "*");
      try {
        const userCode = ${JSON.stringify(code)};
        const tests = ${testPayload};
        const fnName = ${functionName};
        const run = new Function(userCode + "\\n; return typeof " + fnName + " === 'function' ? " + fnName + " : null;");
        const fn = run();
        if (typeof fn !== "function") throw new Error("Define the required function: " + fnName);
        let passed = 0;
        const details = tests.map((test, index) => {
          try {
            const actual = fn(test.input);
            const ok = JSON.stringify(actual) === JSON.stringify(test.expected);
            if (ok) passed++;
            return { index, passed: ok, expected: test.expected, actual: typeof actual === "undefined" ? "undefined" : actual };
          } catch (error) {
            return { index, passed: false, error: String(error && error.message || error) };
          }
        });
        send({ passedTests: passed, totalTests: tests.length, details });
      } catch (error) {
        send({ error: String(error && error.message || error) });
      }
    </script></body></html>`;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      iframe.remove();
      resolve(result);
    };
    const onMessage = (event) => {
      if (event.source !== iframe.contentWindow || !event.data?.__pathpilotRunner) return;
      finish(event.data);
    };
    const timer = setTimeout(() => finish({ error: "Execution timed out after 2 seconds. Check for an infinite loop." }), 2000);
    window.addEventListener("message", onMessage);
    iframe.srcdoc = source;
    document.body.appendChild(iframe);
  });
}

export default function CodingChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [hintIndex, setHintIndex] = useState(-1);
  const editorRef = useRef(null);

  const load = async () => {
    try {
      const [list, attempts] = await Promise.all([api.get("/coding-challenges"), api.get("/coding-challenges/history")]);
      setChallenges(list.data.challenges || []);
      setHistory(attempts.data.submissions || []);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to load coding challenges.");
    }
  };
  useEffect(() => { load(); }, []);

  const latestByChallenge = useMemo(() => {
    const map = {};
    history.forEach(item => { if (!map[item.challengeId]) map[item.challengeId] = item; });
    return map;
  }, [history]);

  const openChallenge = async (id) => {
    setBusy(true); setError(""); setResult(null); setHintIndex(-1);
    try {
      const response = await api.get(`/coding-challenges/${id}`);
      setActive(response.data.challenge);
      setCode(response.data.challenge.starterCode);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to open challenge.");
    } finally { setBusy(false); }
  };

  const runCode = async (save) => {
    if (!active || busy) return;
    setBusy(true);
    setSaving(Boolean(save));
    setError("");
    setSaveMessage("");
    setResult(null);

    try {
      const run = await runInSandbox(code, active);
      if (run.error) {
        setResult({ error: run.error });
        return;
      }

      setResult(run);
      if (!save) return;

      setSaveMessage("Tests completed. Saving your submission...");
      const response = await api.post(`/coding-challenges/${active.id}/submit`, {
        code,
        passedTests: Number(run.passedTests),
        totalTests: Number(run.totalTests)
      });

      const savedSubmission = response.data?.submission;
      if (!response.data?.success || !savedSubmission?._id) {
        throw new Error(response.data?.message || "The server did not confirm that your submission was saved.");
      }

      setResult({ ...run, saved: savedSubmission });
      setSaveMessage(`Saved successfully: ${savedSubmission.passedTests}/${savedSubmission.totalTests} tests recorded.`);
      const historyResponse = await api.get("/coding-challenges/history");
      setHistory(historyResponse.data?.submissions || []);
    } catch (e) {
      const message = e.response?.data?.message || e.message || "Unable to save this submission.";
      setError(message);
      setSaveMessage("");
    } finally {
      setBusy(false);
      setSaving(false);
    }
  };

  const reset = () => { setActive(null); setCode(""); setResult(null); setHintIndex(-1); setError(""); setSaveMessage(""); };

  return <div className="coding-challenges-page">
    <div className="coding-challenges-heading">
      <div><span className="eyebrow">PRACTICE · IMPLEMENT · REVIEW</span><h2>Practical coding challenges</h2><p>Write JavaScript solutions, run sample and hidden-in-the-page test cases, and save your attempts.</p></div>
      <Code2 size={38}/>
    </div>
    {error && <div className="coding-challenge-error">{error}</div>}
    {!active ? <>
      <div className="coding-challenge-grid">{challenges.map(item => {
        const last = latestByChallenge[item.id];
        return <article className="coding-challenge-card" key={item.id}>
          <div className="coding-challenge-card-top"><span className="coding-difficulty">{item.difficulty}</span><span><Clock3 size={14}/> {item.timeMinutes} min</span></div>
          <h3>{item.title}</h3><p>{item.description}</p>
          <div className="coding-challenge-meta"><span>{item.skill}</span><span>JavaScript</span></div>
          {last && <div className={`coding-last-attempt ${last.outcome}`}>Latest saved attempt: {last.passedTests}/{last.totalTests} tests passed</div>}
          <button type="button" onClick={() => openChallenge(item.id)} disabled={busy}>Open challenge <ChevronLeft size={15}/></button>
        </article>;
      })}</div>
      <section className="coding-history-panel"><h3><Trophy size={18}/> Recent submissions</h3>
        {history.length ? history.slice(0, 8).map(item => <div className="coding-history-row" key={item._id}><span>{challenges.find(c => c.id === item.challengeId)?.title || item.challengeId}</span><strong className={item.outcome}>{item.passedTests}/{item.totalTests} tests · {item.outcome === "passed" ? "All passed" : "Needs practice"}</strong><small>{new Date(item.createdAt).toLocaleString()}</small></div>) : <p>No coding submissions yet. Choose a challenge to get started.</p>}
      </section>
    </> : <section className="coding-workspace">
      <div className="coding-workspace-top"><button type="button" className="coding-back" onClick={reset}><ChevronLeft size={16}/> All challenges</button><span className="coding-difficulty">{active.difficulty}</span></div>
      <div className="coding-problem"><h3>{active.title}</h3><p>{active.description}</p><h4>Examples</h4>{active.examples.map((example, i) => <div className="coding-example" key={i}><strong>Example {i + 1}</strong><code>Input: {example.input}</code><code>Output: {example.output}</code></div>)}
        <button type="button" className="coding-hint-button" onClick={() => setHintIndex(v => (v + 1) % active.hints.length)}><Lightbulb size={15}/> {hintIndex < 0 ? "Show a hint" : "Another hint"}</button>
        {hintIndex >= 0 && <p className="coding-hint">{active.hints[hintIndex]}</p>}
      </div>
      <div className="coding-editor-panel"><div className="coding-editor-top"><strong>JavaScript editor</strong><span>Define {active.functionName}()</span></div>
        <textarea ref={editorRef} spellCheck="false" aria-label="JavaScript code editor" value={code} onChange={e => setCode(e.target.value)} />
        <div className="coding-editor-actions"><button type="button" onClick={() => runCode(false)} disabled={busy}><Play size={15}/> {busy ? "Running..." : "Run tests"}</button><button type="button" className="primary" onClick={() => runCode(true)} disabled={busy}><Send size={15}/> {saving ? "Saving..." : "Submit & save"}</button></div>
      </div>
      {saveMessage && <div className="coding-saved-note" role="status">{saveMessage}</div>}
      {result && <div className="coding-result-panel"><h3>{result.error ? "Execution error" : `${result.passedTests}/${result.totalTests} tests passed`}</h3>
        {result.error ? <p className="coding-error-text">{result.error}</p> : <><div className="coding-test-list">{result.details.map((test, i) => <div className={`coding-test-row ${test.passed ? "passed" : "failed"}`} key={i}><span>Test {i + 1}</span><strong>{test.passed ? "Passed" : "Failed"}</strong>{!test.passed && <small>{test.error || `Expected ${JSON.stringify(test.expected)}, received ${JSON.stringify(test.actual)}`}</small>}</div>)}</div>
        {result.saved && <p className="coding-saved-note">This result is browser-generated and is not independently verified.</p>}</>}
      </div>}
      <div className="coding-safety-note"><ShieldAlert size={16}/> Your code runs in a sandboxed browser frame, not on the PathPilot server. Avoid pasting secrets or personal data. Browser-side test results are practice feedback, not tamper-proof certification.</div>
    </section>}
    <p className="coding-disclaimer">Currently supports JavaScript only. C++, Python and server-side execution are not included. Saved attempts are private to your account.</p>
  </div>;
}
