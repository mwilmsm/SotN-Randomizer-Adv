---
to: build/presets/<%=name%>.mjs
---
// This is a generated file. Do not edit it directly.
// Make your changes to presets/<%=name%>.json then rebuild
// this file with `npm run build-presets -- <%=name%>`.

  // Boilerplate.
  import { PresetBuilder } from '../../src/PresetBuilder.mjs';

  // Create PresetBuilder.
  const builder = PresetBuilder.fromJSON(<%-h.preset(name)%>)

  // Export.
  const <%=name%> = builder.build()

  export default <%=name%>;