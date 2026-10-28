# Practices behind the flow

kick's flow is the professional way of starting a product, updated for a world where AI makes real code about as cheap as a detailed drawing. These are the sources and where kick uses each.

| Practice | Source | Idea | In kick |
| --- | --- | --- | --- |
| Inception, discovery | agencies, Thoughtworks | workshops to scope, journeys, sketches, architecture, estimate | the product kick, without a throw-away prototype |
| Dual-track agile | Marty Cagan, Jeff Patton | discovery and delivery side by side | product kick (discover), feature kicks (deliver) |
| Walking skeleton, tracer bullet | Alistair Cockburn; *The Pragmatic Programmer* | one thin flow through every layer, early | the Foundation feature kick, first in the roadmap |
| Executable architecture | the elaboration stage of the Unified Process | architecture is settled when it runs, not on paper | Foundation and the probes |
| Spike | Extreme Programming | a time-boxed experiment; its code is thrown away | probes, marked `(probe)` in the task table |
| API-first with mocks, consumer-driven contracts | OpenAPI, Prism, MSW; Pact | agree the contract, screens on mocks, server built to the contract, contract tests | the mock layer, `api.md`, contract tests in feature kicks |
| Design Sprint | Google Ventures | test with five real users on concrete tasks | trials with real users and tasks, not opinions |
| Shape Up | Basecamp | rough shaping before building; a time budget instead of an estimate; vertical slices | the shape step; the optional time budget (`budget_days`) |
| Story mapping | Jeff Patton | journeys left to right, detail top to bottom, a cut line per release | the screen map with the first-release cut |
| Cone of uncertainty | Barry Boehm, Steve McConnell | early estimates can be off four times; they narrow at milestones | ranges that narrow at each agreement |
| Design system before screens | common practice | tokens and components first | the design rules and the app shell come first |

## What changes with AI

These practices were made when code cost more than drawings, so early designs were drawn and thrown away. With AI, the real screens in the chosen stack cost about as much as a detailed design file, and they are kept. The data model and the server side still cost the most to change, so they wait until people have used the real screens.
