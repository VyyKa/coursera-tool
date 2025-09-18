import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  handleAutoquiz,
  handleReview,
  handlePeerGradedAssignment,
  handleDiscussionPrompt,
  requestGradingByPeer,
  waitForSelector,
  resolveWeekMaterial,
  getMaterial,
  getAllMaterials,
  autoJoin,
} from './index';
import { Button } from './components/Button';
import Checkbox from './components/Checkbox';
import { LoadingProps, Method, SettingOptions } from './type';
import Footer from './components/Footer';
import {
  ChevronRightIcon,
  Clapper,
  LoadingIcon,
  Note,
  Paintbrush,
  Play,
  Quiz,
  Setting,
} from './components/Icon';
import GetShareableLink from './components/GetShareableLink';
import toast, { Toaster } from 'react-hot-toast';
import { courseraLogo } from './constants';
import { sendTrackingEvent } from './tracking';
// import {
//   autoJoinAll,
//   getSpecializationMaterials,
//   openAllQuiz,
//   resolveDiscussion,
//   resolveMaterial,
// } from './auto-all';

export default function App() {
  const [courseList, setCourseList] = useState<any>([]);
  // Draggable panel state
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const methods = [
    {
      name: 'Source FPT',
      value: 'source',
    },
    {
      name: 'Gemini',
      value: 'gemini',
    },
    // {
    //   name: 'ChatGPT',
    //   value: 'chatgpt',
    // },
    // {
    //   name: 'DeepSeek',
    //   value: 'deepseek',
    // },
  ];

  const [currentCourse, setCurrentCourse] = useState('SSL101c');
  const [isShowControlPanel, setIsShowControlPanel] = useState(false);

  const [options, setOptions] = useState<SettingOptions>({
    isAutoSubmitQuiz: true,
    isDebugMode: false,
    method: Method.Gemini,
  });
  const [isLoading, setIsLoading] = useState<LoadingProps>({
    isLoadingReview: false,
    isLoadingQuiz: false,
    isLoadingSubmitPeerGrading: false,
    isLoadingDiscuss: false,
    isLoadingCompleteWeek: false,
    isLoadingDisableAI: false,
  });
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
    sourceAPI: '',
    chatgptAPI: '',
    geminiAPI: '',
    deepseekAPI: '',
  });

  useEffect(() => {
    (async () => {
      // Course map disabled - using default course
      let courseMap = {};
      // console.log(courseMap);

      const { course } = await chrome.storage.local.get('course');
      let flag = false;
      let courseCode = '';
      Object.entries(courseMap).forEach(([key, value]: any) => {
        value.related.forEach((item: string) => {
          if (location.href.includes(item)) {
            chrome.storage.local.set({ course: key });
            setCurrentCourse(key);
            courseCode = key;
            flag = true;
          }
        });
      });

      const { isAutoSubmitQuiz } = await chrome.storage.local.get('isAutoSubmitQuiz');
      const { isShowControlPanel } = await chrome.storage.local.get('isShowControlPanel');
      const { isDebugMode } = await chrome.storage.local.get('isDebugMode');
      const { method } = await chrome.storage.local.get('method');

      // console.log(isAutoSubmitQuiz);
      setCourseList(courseMap);
      setOptions({
        isAutoSubmitQuiz: isAutoSubmitQuiz,
        isDebugMode: isDebugMode == undefined ? false : isDebugMode,
        method: method == undefined ? Method.Source : method,
      });
      setIsShowControlPanel(isShowControlPanel == undefined ? true : isShowControlPanel);

      await handleAutoquiz(courseCode, setIsLoading);
      await autoJoin();
    })();
  }, []);

  // Initialize draggable position from storage
  useEffect(() => {
    (async () => {
      const { panelPos } = await chrome.storage.local.get('panelPos');
      if (panelPos && typeof panelPos.x === 'number' && typeof panelPos.y === 'number') {
        setPanelPos(panelPos);
        const el = document.getElementById('coursera-tool');
        if (el) {
          el.style.left = panelPos.x + 'px';
          el.style.top = panelPos.y + 'px';
          el.style.right = 'auto';
          el.style.bottom = 'auto';
        }
      }
    })();
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    // Ignore drags from interactive controls
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a')) return;

    const el = document.getElementById('coursera-tool');
    if (!el) return;

    // Compute current left/top in px
    const rect = el.getBoundingClientRect();
    // Convert to absolute left/top (since element may be positioned via right/bottom initially)
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';

    dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setIsDragging(true);

    // Attach window listeners for smooth drag
    const onMove = (ev: MouseEvent) => {
      if (!isDragging) return;
      const el2 = document.getElementById('coursera-tool');
      if (!el2) return;
      const x = Math.max(8, Math.min(window.innerWidth - el2.clientWidth - 8, ev.clientX - dragOffset.current.dx));
      const y = Math.max(8, Math.min(window.innerHeight - el2.clientHeight - 8, ev.clientY - dragOffset.current.dy));
      el2.style.left = x + 'px';
      el2.style.top = y + 'px';
      setPanelPos({ x, y });
      document.body.style.userSelect = 'none';
    };
    const onUp = async () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      if (panelPos) await chrome.storage.local.set({ panelPos });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    e.preventDefault();
  };

  useEffect(() => {
    const fetchApiKeys = async () => {
      const keys = await chrome.storage.local.get([
        'sourceAPI',
        'chatgptAPI',
        'geminiAPI',
        'deepseekAPI',
      ]);
      setApiKeys(keys);
    };

    fetchApiKeys();
  }, []);

  return (
    <>
      <div
        className={`w-10 h-10 rounded-full fixed bottom-3 right-6 p-2 cursor-pointer bg-no-repeat bg-center bg-cover transition-all duration-300 ${!isShowControlPanel ? 'translate-y-0 opacity-100' : 'translate-y-[100px] opacity-0'}`}
        onClick={() => {
          setIsShowControlPanel(true);
          chrome.storage.local.set({ isShowControlPanel: true });
        }}
        style={{
          backgroundImage: `url(${courseraLogo})`,
          zIndex: 1000,
        }}
      ></div>

      <div
        onMouseDown={onDragStart}
        className={`bg-white absolute border border-zinc-200 shadow-xl ring-1 ring-black/5 w-[380px] -bottom-4 p-4 right-0 rounded-xl transition-all ${isShowControlPanel ? '-translate-x-0 opacity-100' : 'translate-x-[500px] opacity-0'}`}
      >
        <div
          className="absolute top-2 right-2 cursor-pointer"
          onClick={() => {
            setIsShowControlPanel(false);
            chrome.storage.local.set({ isShowControlPanel: false });
          }}
        >
          <ChevronRightIcon />
        </div>
        <GetShareableLink />
        <div className="font-semibold text-sm mb-3 flex gap-2">
          <Clapper width={20} height={20} />
          Course Progress
        </div>
        <div className="flex gap-2">
          <Button
            icon={<Paintbrush />}
            className=""
            title="Auto skip all readings & videos"
            onClick={async () => {
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingCompleteWeek: true }));
              await sendTrackingEvent();
              await resolveWeekMaterial();
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingCompleteWeek: false }));
              location.reload();
            }}
            isLoading={isLoading.isLoadingCompleteWeek}
          >
            Skip videos & readings
          </Button>
          <Button
            className=""
            title="Auto skip all readings & videos"
            onClick={async () => {
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingDiscuss: true }));
              await sendTrackingEvent();
              await handleDiscussionPrompt();
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingDiscuss: false }));
              location.reload();
            }}
            isLoading={isLoading.isLoadingDiscuss}
          >
            Skip discussions
          </Button>
        </div>

        <div className="font-semibold my-3 flex gap-2 text-sm">
          <Note width={20} height={20} />
          Assignment
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 items-center">
          <Button
            title="Auto submit assignments (May not work)"
            onClick={async () => {
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingSubmitPeerGrading: true }));
              await sendTrackingEvent();
              await handlePeerGradedAssignment();
              setIsLoading((prev: LoadingProps) => ({
                ...prev,
                isLoadingSubmitPeerGrading: false,
              }));
            }}
            isLoading={isLoading.isLoadingSubmitPeerGrading}
          >
            Auto submit
          </Button>
          <Button
            title="Auto grade assignments"
            onClick={async () => {
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingReview: true }));
              await sendTrackingEvent();
              toast.promise(
                async () => {
                  await handleReview();
                },
                {
                  loading: 'Grading ...',
                  success: <p>Grading done!</p>,
                  error: <p>Grading failed!</p>,
                },
              );
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingReview: false }));
            }}
            isLoading={isLoading.isLoadingReview}
          >
            Auto grade
          </Button>
          <Button
            title="Disable AI grading for your submission"
            onClick={async () => {
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingDisableAI: true }));
              await sendTrackingEvent();
              await requestGradingByPeer();
              setIsLoading((prev: LoadingProps) => ({ ...prev, isLoadingDisableAI: false }));
            }}
            isLoading={isLoading.isLoadingDisableAI}
          >
            Disable AI grading
          </Button>
        </div>
        <div className="font-semibold text-sm my-3 flex gap-2">
          <Quiz width={20} height={20} />
          Quiz Automation
        </div>
        <div className="flex items-center gap-2 w-full text-sm flex-nowrap">
          <span className="whitespace-nowrap">Gemini API:</span>
          <input
            type="text"
            className="border rounded-lg px-2 py-1 flex-1 min-w-0 no-ring border-zinc-300 focus:border-blue-600 text-zinc-600 focus:text-black"
            placeholder="Enter Gemini API"
            value={apiKeys.geminiAPI || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              chrome.storage.local.set({ geminiAPI: newValue });
              setApiKeys((prev) => ({ ...prev, geminiAPI: newValue }));
            }}
          />
          <Button
            className="!py-1 shrink-0"
            title="Test Gemini API key"
            onClick={async () => {
              try {
                const key = (await chrome.storage.local.get('geminiAPI')).geminiAPI || apiKeys.geminiAPI;
                if (!key) return alert('Please enter Gemini API first');
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, { method: 'GET' });
                if (res.ok) toast.success('Gemini API is valid');
                else toast.error('Gemini API invalid');
              } catch (e) {
                toast.error('Cannot verify Gemini API');
              }
            }}
          >
            Test
          </Button>
          <Button
            className="!py-1 min-w-[72px] shrink-0"
            title="Start auto quiz"
            onClick={async () => {
              await sendTrackingEvent();
              try {
                await handleAutoquiz(currentCourse, setIsLoading);
              } catch (error) {
                console.log(error);
              }
            }}
            isLoading={isLoading.isLoadingQuiz}
            icon={<Play width={22} height={22} />}
          >
            Start
          </Button>
        </div>

        {/* Settings removed: default to Gemini */}
        {
          (() => {
            chrome.storage.local.set({ method: Method.Gemini });
            return null;
          })()
        }
        {/* Removed Done all button */}
        {location.href.includes('debug=true') && (
          <div className="flex gap-4 items-center justify-start my-2">
            <Checkbox
              id={'is-debug-mode'}
              checked={options.isDebugMode}
              children={'Debug mode'}
              onChange={(e: HTMLInputElement) => {
                setOptions((prev) => {
                  chrome.storage.local.set({ isDebugMode: !prev.isDebugMode });
                  return { ...prev, isDebugMode: !prev.isDebugMode };
                });
              }}
            />
          </div>
        )}

        <Footer />
      </div>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{ success: { duration: 4000 } }}
      />
    </>
  );
}
