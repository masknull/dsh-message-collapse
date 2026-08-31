// dsh-message-collapse — browser half.
// Registers the `user` (and `steering`) keyed Chat-node renderer so long user
// messages collapse after 12 lines with a fade + chevron toggle, while the
// product's default bubble styling, @mention projection, images, reference
// labels, clock, and copy action are preserved.
//
// This is a `dsh.client` lazy bundle: `window.__ModuleLoader__.load` registers
// a factory; `require` resolves against the platform seed table (react, primitives,
// slots). Loading is lazy and side-effect free; apply() registers only under
// the current fiber so HMR invalidation and reload cleanly unwinds it.
window.__ModuleLoader__.load({
  id: 'dsh-message-collapse',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    var React = require('react')
    var prim = require('@deepseek-ai/dsh-client-ui-primitives')

    var THRESHOLD_LINES = 10

    // ── replicated product bubble + actions styles (theme tokens, not hardcoded) ──
    var STYLE = [
      '.dshmc-row{display:flex;flex-direction:column;align-items:flex-end;gap:6px}',
      '.dshmc-stack{display:flex;flex-direction:column;align-items:flex-end;gap:8px;min-width:0;',
      '  max-width:min(calc(var(--dsh-chat-content-width, 748px) * 0.702), 82%)}',
      '.dshmc-bubble{position:relative;max-width:100%;background:var(--dsw-specific-bubble);',
      '  border-radius:22px;padding:10px 16px;font-size:var(--dsh-content-font-size, 14px);',
      '  line-height:calc(22px + var(--dsh-content-font-delta, 0px));color:var(--dsw-alias-label-primary);',
      '  white-space:pre-wrap;word-break:break-word;',
      '  display:flex;flex-direction:column;align-items:stretch}',
      // collapse container: identical box model in both states so the bubble
      // width never jumps; line-clamp while collapsed, plain block when expanded
      '.dshmc-collapsible{width:100%;box-sizing:border-box;max-width:100%}',
      '.dshmc-collapsible[data-collapsed="true"]{display:-webkit-box;-webkit-line-clamp:' + THRESHOLD_LINES + ';',
      '  -webkit-box-orient:vertical;overflow:hidden}',
      '.dshmc-collapsible[data-collapsed="false"]{white-space:pre-wrap}',
      // toggle floats inside the bubble at its bottom-right, sharing the last text line
      '.dshmc-toggle{position:absolute;right:16px;bottom:10px;display:inline-flex;align-items:center;gap:6px;',
      '  padding:2px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;',
      '  background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);',
      '  font-size:12px;line-height:18px;cursor:pointer}',
      '.dshmc-toggle:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2);',
      '  background:var(--dsw-alias-interactive-bg-hover)}',
      '.dshmc-toggle svg{width:14px;height:14px;transition:transform 120ms ease}',
      '.dshmc-toggle[data-collapsed="false"] svg{transform:rotate(180deg)}',
      '.dshmc-ref{color:var(--dsw-alias-label-tertiary);font-size:var(--dsh-content-font-size-secondary, 13px);',
      '  line-height:calc(18px + var(--dsh-content-font-delta-secondary, 0px))}',
      '.dshmc-actions{display:flex;align-items:center;gap:10px;height:calc(28px + var(--dsh-content-font-delta, 0px))}',
      '.dshmc-clock{padding-right:12px;font-size:var(--dsh-content-font-size, 14px);',
      '  line-height:calc(24px + var(--dsh-content-font-delta, 0px));color:var(--dsw-alias-label-tertiary);white-space:nowrap}',
      '.dshmc-action{display:inline-flex;align-items:center;justify-content:center;width:calc(28px + var(--dsh-content-font-delta, 0px));',
      '  height:calc(28px + var(--dsh-content-font-delta, 0px));padding:6px;border:none;border-radius:28px;',
      '  background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}',
      '.dshmc-action:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}',
      '.dshmc-action svg{width:calc(16px + var(--dsh-content-font-delta, 0px));height:calc(16px + var(--dsh-content-font-delta, 0px))}',
      '@media (hover:hover){[data-time-hover-root] .dshmc-clock{opacity:0;transition:opacity 80ms ease}',
      '  [data-time-hover-root]:hover .dshmc-clock,[data-time-hover-root]:focus-within .dshmc-clock{opacity:1}}',
    ].join('\n')

    // ── content extraction, same shape the product's UserMessageNodeView uses ──
    function contentParts(content) {
      var texts = []
      var images = []
      var rest = []
      if (content && Array.isArray(content)) {
        for (var i = 0; i < content.length; i++) {
          var block = content[i]
          if (block === null || block === undefined || typeof block !== 'object') continue
          if (block.type === 'text' && typeof block.text === 'string') {
            texts.push(block.text)
          } else if (block.type === 'image' && block.attachment !== undefined) {
            images.push({ attachment: block.attachment })
          } else {
            rest.push(block)
          }
        }
      }
      return { text: texts.join(''), images: images, rest: rest }
    }

    // ── clock, replicated from the product's formatMessageClock ──
    function pad2(n) {
      return String(n).padStart(2, '0')
    }
    function formatClock(time, t, now) {
      var d = new Date(time)
      var n = new Date(now === undefined ? Date.now() : now)
      var clock = pad2(d.getHours()) + ':' + pad2(d.getMinutes())
      if (
        d.getFullYear() === n.getFullYear()
        && d.getMonth() === n.getMonth()
        && d.getDate() === n.getDate()
      ) {
        return clock
      }
      var params = { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
      var md = d.getFullYear() === n.getFullYear()
        ? t('clock.md', params)
        : t('clock.ymd', params)
      return md + ' ' + clock
    }

    // ── copy action, replicated from the product's MessageIconActions copy ──
    function CopyAction(props) {
      var text = props.text
      var t = props.t
      var copied = React.useState(false)
      var onCopy = React.useCallback(function () {
        if (copied[0]) return
        prim.writeClipboard(text).then(function (ok) {
          if (!ok) return
          copied[1](true)
          setTimeout(function () { copied[1](false) }, 1000)
        })
      }, [copied, text])
      return React.createElement(prim.Tooltip, {
        label: copied[0] ? t('copied') : t('copy'),
        side: 'bottom',
      }, React.createElement('button', {
        type: 'button',
        className: 'dshmc-action',
        'aria-label': copied[0] ? t('copied') : t('copy'),
        onClick: onCopy,
      }, copied[0]
        ? React.createElement(prim.IconCheckOutline16, null)
        : React.createElement(prim.IconCopyOutline16, null)))
    }

    // ── the keyed Chat renderer for `user` / `steering` nodes ──
    function CollapsibleUserNode(props) {
      var node = props.node
      var renderMessageImages = props.renderMessageImages
      var t = props.t
      var data = node.data
      var parts = contentParts(data.content)
      var text = parts.text

      var bubbleRef = React.useRef(null)
      var collapsedState = React.useState(true)
      var collapsed = collapsedState[0]
      var setCollapsed = collapsedState[1]
      var needsToggleState = React.useState(false)
      var needsToggle = needsToggleState[0]
      var setNeedsToggle = needsToggleState[1]

      // Measure overflow while collapsed: if content fits within the clamp,
      // reveal everything and skip the toggle; a later text change re-measures.
      React.useEffect(function () {
        var el = bubbleRef.current
        if (el === null) return
        var over = el.scrollHeight > el.clientHeight + 1
        setNeedsToggle(function (prev) { return prev || over })
        if (!over) setCollapsed(false)
      }, [text])

      var toggle = React.useCallback(function () {
        setCollapsed(function (v) { return !v })
      }, [])

      var showBubble = text !== '' || parts.rest.length > 0

      // text content: @mention projection + any extra blocks
      var contentNodes = []
      if (text !== '') contentNodes.push(prim.projectUserText(text, data.referenceLabels || []))
      for (var i = 0; i < parts.rest.length; i++) {
        ;(function (block, index) {
          contentNodes.push(React.createElement(prim.JsonBlock, {
            key: 'rest-' + index,
            label: t('message.extraBlock'),
            payload: block,
            truncatedLabel: function (total) { return t('json.truncated', { total: total }) },
          }))
        })(parts.rest[i], i)
      }

      var stackChildren = []
      if (parts.images.length > 0) {
        stackChildren.push(React.createElement(React.Fragment, { key: 'imgs' },
          renderMessageImages({ images: parts.images, align: 'end' })))
      }
      if (showBubble) {
        var bubbleChildren = [
          React.createElement('div', {
            key: 'text',
            ref: bubbleRef,
            className: 'dshmc-collapsible',
            'data-collapsed': collapsed ? 'true' : 'false',
          }, contentNodes),
        ]
        if (needsToggle) {
          bubbleChildren.push(React.createElement('button', {
            key: 'toggle',
            type: 'button',
            className: 'dshmc-toggle',
            'data-collapsed': collapsed ? 'true' : 'false',
            onClick: toggle,
          },
            React.createElement(prim.IconChevronDownOutline14, null),
            collapsed ? '\u5C55\u5F00\u5168\u90E8' : '\u6536\u8D77'))
        }
        stackChildren.push(React.createElement('div', { key: 'bubble', className: 'dshmc-bubble' },
          ...bubbleChildren))
      }
      if (data.referenceLabels !== undefined && data.referenceLabels.length > 0) {
        stackChildren.push(React.createElement('div', { key: 'refs', className: 'dshmc-ref' },
          t('message.referenceSummary', {
            labels: data.referenceLabels.join(t('message.referenceSeparator')),
          })))
      }

      var actions = React.createElement('div', { key: 'actions', className: 'dshmc-actions' },
        data.time !== undefined
          ? React.createElement('span', { key: 'clock', className: 'dshmc-clock' },
              formatClock(data.time, t))
          : null,
        React.createElement(CopyAction, { key: 'copy', text: text, t: t }))

      return React.createElement('div', { className: 'dshmc-row', 'data-time-hover-root': true },
        React.createElement('div', { className: 'dshmc-stack' }, ...stackChildren),
        actions)
    }

    var name = 'dsh-message-collapse'
    var inject = ['slots']

    function apply(ctx) {
      ctx.effect(function* () {
        var style = document.createElement('style')
        style.dataset.plugin = name
        style.textContent = STYLE
        document.head.appendChild(style)
        var slots = ctx.slots
        yield slots.inject('conversation.chat.node', function () {
          return slots.register(
            { name: 'conversation.chat.node', key: 'user', locale: 'chat' },
            CollapsibleUserNode,
          )
        })
        yield slots.inject('conversation.chat.node', function () {
          return slots.register(
            { name: 'conversation.chat.node', key: 'steering', locale: 'chat' },
            CollapsibleUserNode,
          )
        })
        yield function () {
          if (style.parentNode !== null) style.parentNode.removeChild(style)
        }
      })
    }

    module.exports = { name: name, inject: inject, apply: apply }
    return module.exports
  },
})
