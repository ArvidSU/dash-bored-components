import Button from "./button";
import Card from "./card";
import Chart from "./chart";
import Command from "./command";
import Conditional from "./conditional";
import Env from "./env";
import FocusTimer from "./focus-timer";
import Group from "./group";
import List from "./list";
import LiveChart from "./live-chart";
import Markdown from "./markdown";
import Selection from "./selection";
import SetupAgent from "./setup-agent";
import Status from "./status";
import Tabs from "./tabs";
import TodoList from "./todo-list";
import Webview from "./webview";
import type PublicButton from "../../../button";
import type PublicCard from "../../../card";
import type PublicChart from "../../../chart";
import type PublicCommand from "../../../command";
import type PublicConditional from "../../../conditional";
import type PublicEnv from "../../../env";
import type PublicFocusTimer from "../../../focus-timer";
import type PublicGroup from "../../../group";
import type PublicList from "../../../list";
import type PublicLiveChart from "../../../live-chart";
import type PublicMarkdown from "../../../markdown";
import type PublicSelection from "../../../selection";
import type PublicSetupAgent from "../../../setup-agent";
import type PublicStatus from "../../../status";
import type PublicTabs from "../../../tabs";
import type PublicTodoList from "../../../todo-list";
import type PublicWebview from "../../../webview";

// These assignments ensure every authored implementation accepts its shipped,
// manifest-derived public props and the published renderer SDK contract.
const publicComponentSignatures = [
  Button satisfies typeof PublicButton,
  Card satisfies typeof PublicCard,
  Chart satisfies typeof PublicChart,
  Command satisfies typeof PublicCommand,
  Conditional satisfies typeof PublicConditional,
  Env satisfies typeof PublicEnv,
  FocusTimer satisfies typeof PublicFocusTimer,
  Group satisfies typeof PublicGroup,
  List satisfies typeof PublicList,
  LiveChart satisfies typeof PublicLiveChart,
  Markdown satisfies typeof PublicMarkdown,
  Selection satisfies typeof PublicSelection,
  SetupAgent satisfies typeof PublicSetupAgent,
  Status satisfies typeof PublicStatus,
  Tabs satisfies typeof PublicTabs,
  TodoList satisfies typeof PublicTodoList,
  Webview satisfies typeof PublicWebview,
];

void publicComponentSignatures;
