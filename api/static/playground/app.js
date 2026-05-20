(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const catalog = $("#catalog");
  const filter = $("#filter");
  const epPanel = $("#endpoint-panel");
  const epTitle = $("#ep-title");
  const epMethod = $("#ep-method");
  const epPath = $("#ep-path");
  const epSummary = $("#ep-summary");
  const epForm = $("#ep-form");
  const epRun = $("#ep-run");
  const epStatus = $("#ep-status");
  const epResponse = $("#ep-response").querySelector("code");
  const hint = $("#hint");

  const state = { spec: null, endpoints: [], selected: null };

  function el(tag, opts = {}, children = []) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text != null) node.textContent = opts.text;
    if (opts.attrs) {
      for (const [k, v] of Object.entries(opts.attrs)) {
        if (v === false || v == null) continue;
        if (v === true) node.setAttribute(k, "");
        else node.setAttribute(k, String(v));
      }
    }
    if (opts.dataset) {
      for (const [k, v] of Object.entries(opts.dataset)) node.dataset[k] = String(v);
    }
    if (opts.on) {
      for (const [k, v] of Object.entries(opts.on)) node.addEventListener(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  // ---------- OpenAPI catalog ----------

  async function loadSpec() {
    try {
      const res = await fetch("/openapi.json");
      if (!res.ok) throw new Error(`openapi.json -> ${res.status}`);
      state.spec = await res.json();
    } catch (err) {
      clear(catalog);
      catalog.appendChild(el("p", { className: "muted", text: `Failed to load /openapi.json: ${err.message}` }));
      return;
    }
    state.endpoints = flattenSpec(state.spec);
    state.endpoints.push({
      method: "ws",
      path: "/ws/ops",
      tag: "Subscriptions",
      operationId: "ws_ops",
      summary: "Live op stream (use the Live op feed panel above)",
      parameters: [
        { name: "op_type", in: "query", schema: { type: "string" } },
        { name: "account", in: "query", schema: { type: "string" } },
      ],
      requestBody: null,
      isWs: true,
    });
    renderCatalog();
  }

  function flattenSpec(spec) {
    const out = [];
    const paths = spec.paths || {};
    for (const path of Object.keys(paths)) {
      const item = paths[path];
      for (const method of ["get", "post", "put", "delete", "patch"]) {
        const op = item[method];
        if (!op) continue;
        out.push({
          method,
          path,
          tag: (op.tags && op.tags[0]) || "Other",
          operationId: op.operationId || `${method}_${path}`,
          summary: op.summary || op.description || "",
          parameters: op.parameters || [],
          requestBody: op.requestBody || null,
        });
      }
    }
    return out;
  }

  function groupByTag(eps) {
    const groups = new Map();
    for (const ep of eps) {
      if (!groups.has(ep.tag)) groups.set(ep.tag, []);
      groups.get(ep.tag).push(ep);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }

  function renderCatalog() {
    const term = (filter.value || "").trim().toLowerCase();
    const visible = state.endpoints.filter((ep) => {
      if (!term) return true;
      return (
        ep.path.toLowerCase().includes(term) ||
        ep.method.toLowerCase().includes(term) ||
        ep.tag.toLowerCase().includes(term) ||
        ep.summary.toLowerCase().includes(term)
      );
    });
    const groups = groupByTag(visible);
    clear(catalog);
    if (!groups.length) {
      catalog.appendChild(el("p", { className: "muted", text: "No matches." }));
      return;
    }
    for (const [tag, eps] of groups) {
      const group = el("div", { className: "tag-group" }, [
        el("div", { className: "tag-name", text: tag }),
      ]);
      for (const ep of eps) {
        const active = state.selected && epKey(state.selected) === epKey(ep);
        const btn = el(
          "button",
          {
            className: `ep${active ? " active" : ""}`,
            dataset: { key: epKey(ep) },
            on: { click: () => selectEndpoint(ep) },
          },
          [
            el("span", { className: `method ${ep.method}`, text: ep.method.toUpperCase() }),
            el("code", { text: ep.path }),
          ]
        );
        group.appendChild(btn);
      }
      catalog.appendChild(group);
    }
  }

  const epKey = (ep) => `${ep.method} ${ep.path}`;

  // ---------- Endpoint form ----------

  function selectEndpoint(ep) {
    state.selected = ep;
    hint.classList.add("hidden");
    epPanel.classList.remove("hidden");
    epTitle.textContent = ep.summary || ep.operationId;
    epMethod.className = `method ${ep.method}`;
    epMethod.textContent = ep.method.toUpperCase();
    epPath.textContent = ep.path;
    epSummary.textContent = ep.summary || "";
    clear(epForm);

    for (const p of ep.parameters || []) addParamField(p);
    if (ep.requestBody) addBodyField(ep.requestBody);

    if (ep.isWs) {
      epRun.disabled = true;
      epStatus.textContent = "Use the Live op feed panel above to connect.";
    } else {
      epRun.disabled = false;
      epStatus.textContent = "";
    }

    epResponse.textContent = "—";
    renderCatalog();
  }

  function addParamField(p) {
    const schema = p.schema || {};
    const type = schema.type || "string";
    const example = schema.example ?? schema.default ?? "";
    const wrap = el("label", { className: p.in === "query" || p.in === "path" ? "" : "full" }, [
      el("span", {}, [
        document.createTextNode(`${p.name}${p.required ? " *" : ""} `),
        el("span", { className: "where", text: `(${p.in})` }),
      ]),
      el("input", {
        attrs: {
          name: p.name,
          type: type === "integer" || type === "number" ? "number" : "text",
          placeholder: String(example),
          required: !!p.required,
        },
        dataset: { in: p.in, type },
      }),
    ]);
    epForm.appendChild(wrap);
  }

  function addBodyField(rb) {
    const content = rb.content || {};
    const json = content["application/json"];
    if (!json) return;
    const schema = resolveSchema(json.schema);
    const sample = sampleFromSchema(schema);
    const ta = el("textarea", { dataset: { in: "body" }, attrs: { id: "f-body" } });
    ta.value = JSON.stringify(sample, null, 2);
    const wrap = el("label", { className: "full" }, [
      el("span", {}, [
        document.createTextNode("request body "),
        el("span", {
          className: "where",
          text: `(application/json${rb.required ? ", required" : ""})`,
        }),
      ]),
      ta,
    ]);
    epForm.appendChild(wrap);
  }

  function resolveSchema(schema) {
    if (!schema) return {};
    if (schema.$ref) {
      const name = schema.$ref.split("/").pop();
      const found = state.spec.components?.schemas?.[name];
      return found ? resolveSchema(found) : {};
    }
    return schema;
  }

  function sampleFromSchema(schema) {
    schema = resolveSchema(schema);
    if (!schema || typeof schema !== "object") return null;
    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;
    if (schema.enum) return schema.enum[0];
    if (schema.type === "object" || schema.properties) {
      const out = {};
      const props = schema.properties || {};
      for (const k of Object.keys(props)) {
        out[k] = sampleFromSchema(props[k]);
      }
      return out;
    }
    if (schema.type === "array") return [sampleFromSchema(schema.items || {})];
    if (schema.type === "integer" || schema.type === "number") return 0;
    if (schema.type === "boolean") return false;
    if (schema.type === "string") {
      if (schema.format === "date-time") return new Date().toISOString();
      if (schema.format === "uri" || schema.format === "url") return "https://example.com";
      return "";
    }
    return null;
  }

  // ---------- Request ----------

  async function runRequest() {
    if (!state.selected) return;
    const ep = state.selected;
    let path = ep.path;
    const query = new URLSearchParams();
    let body = undefined;
    const headers = {};

    for (const field of epForm.querySelectorAll("[data-in]")) {
      const where = field.dataset.in;
      const name = field.name;
      const val = field.value;
      if (where === "path") {
        if (!val) {
          epStatus.textContent = `Missing required path param "${name}"`;
          return;
        }
        path = path.replace(`{${name}}`, encodeURIComponent(val));
      } else if (where === "query") {
        if (val !== "") query.append(name, val);
      } else if (where === "header") {
        if (val !== "") headers[name] = val;
      } else if (where === "body") {
        if (val.trim()) {
          try {
            body = JSON.stringify(JSON.parse(val));
            headers["Content-Type"] = "application/json";
          } catch (err) {
            epStatus.textContent = `Body is not valid JSON: ${err.message}`;
            return;
          }
        }
      }
    }

    const qs = query.toString();
    const url = path + (qs ? `?${qs}` : "");

    epStatus.textContent = `${ep.method.toUpperCase()} ${url} …`;
    epResponse.textContent = "…";
    const started = performance.now();

    try {
      const res = await fetch(url, {
        method: ep.method.toUpperCase(),
        headers,
        body,
      });
      const elapsed = (performance.now() - started).toFixed(0);
      const ct = res.headers.get("content-type") || "";
      let text;
      if (ct.includes("application/json")) {
        const json = await res.json();
        text = JSON.stringify(json, null, 2);
        renderHighlightedJson(text);
      } else {
        text = await res.text();
        epResponse.textContent = text;
      }
      epStatus.textContent = `${res.status} ${res.statusText} · ${elapsed} ms · ${text.length.toLocaleString()} bytes`;
    } catch (err) {
      epStatus.textContent = `Network error: ${err.message}`;
      epResponse.textContent = String(err);
    }
  }

  // ---------- JSON highlight (DOM-only, no innerHTML) ----------

  const JSON_TOKEN_RE = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:?)|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g;

  function renderHighlightedJson(json) {
    clear(epResponse);
    let last = 0;
    for (const m of json.matchAll(JSON_TOKEN_RE)) {
      if (m.index > last) {
        epResponse.appendChild(document.createTextNode(json.slice(last, m.index)));
      }
      const tok = m[0];
      let cls;
      if (m[1]) cls = /:\s*$/.test(tok) ? "json-key" : "json-string";
      else if (m[2]) cls = tok === "null" ? "json-null" : "json-bool";
      else cls = "json-number";
      epResponse.appendChild(el("span", { className: cls, text: tok }));
      last = m.index + tok.length;
    }
    if (last < json.length) {
      epResponse.appendChild(document.createTextNode(json.slice(last)));
    }
  }

  // ---------- WebSocket ----------

  const ws = { sock: null };
  const wsStatus = $("#ws-status");
  const wsToggle = $("#ws-toggle");
  const wsClear = $("#ws-clear");
  const wsFeed = $("#ws-feed");

  function wsConnect() {
    const opType = $("#ws-op-type").value.trim();
    const account = $("#ws-account").value.trim();
    const params = new URLSearchParams();
    if (opType) params.set("op_type", opType);
    if (account) params.set("account", account);
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${location.host}/ws/ops${params.toString() ? `?${params}` : ""}`;
    setWsStatus("connecting…");
    const sock = new WebSocket(url);
    ws.sock = sock;
    sock.onopen = () => {
      setWsStatus("connected", true);
      wsToggle.textContent = "Disconnect";
    };
    sock.onclose = () => {
      setWsStatus("disconnected");
      wsToggle.textContent = "Connect";
      ws.sock = null;
    };
    sock.onerror = () => setWsStatus("error");
    sock.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      appendWsRow(msg);
    };
  }

  function setWsStatus(label, on = false) {
    wsStatus.textContent = label;
    wsStatus.classList.toggle("on", on);
  }

  function appendWsRow(msg) {
    const ts = (msg.timestamp || "").replace("T", " ").slice(0, 19);
    const opType = msg.op_type || "?";
    const body = msg.body ? JSON.stringify(msg.body) : "";
    const li = el("li", {}, [
      el("span", { className: "ts", text: ts }),
      el("span", { className: "opt", text: opType }),
      el("span", { className: "body", text: body, attrs: { title: body } }),
    ]);
    wsFeed.insertBefore(li, wsFeed.firstChild);
    while (wsFeed.children.length > 200) wsFeed.removeChild(wsFeed.lastChild);
  }

  wsToggle.addEventListener("click", () => {
    if (ws.sock) ws.sock.close();
    else wsConnect();
  });
  wsClear.addEventListener("click", () => clear(wsFeed));

  // ---------- Wire-up ----------

  epRun.addEventListener("click", (e) => { e.preventDefault(); runRequest(); });
  epForm.addEventListener("submit", (e) => { e.preventDefault(); runRequest(); });
  filter.addEventListener("input", renderCatalog);

  loadSpec();
})();
