import { Feedback as FeedbackIcon, Help, Support } from './Icon';
import packageData from '../../../package.json';

export default function Footer() {
  return (
    <div>
      <div className="text-xs font-semibold pt-3 flex">
        <div className="grow flex justify-start items-center">v{packageData.version}</div>
        <div className="flex gap-6">
          <a
            className="grow-0 flex gap-2 items-center hover:text-blue-700 hover:underline"
            target="_blank"
            href="https://www.facebook.com/hotailienvykha"
          >
            <Support width={16} height={16} />
            Support
          </a>
        </div>
      </div>
      {/* <div
        onClick={async () => {
          const settingsLink = await mellowtel.generateSettingsLink();
          console.log(settingsLink);
          window.open(settingsLink, '_blank');
        }}
        className="cursor-pointer text-xs grow-0 flex gap-2 items-center hover:text-blue-700 hover:underline mt-3 justify-end"
      >
        <Support width={16} height={16} />
        Support me by opt-in this extension
      </div> */}
    </div>
  );
}
