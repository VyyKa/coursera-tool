import { LoadingIcon } from './Icon';

export const Button = ({ className, children, onClick, isLoading, title, icon }: any) => {
  return (
    <button
      disabled={isLoading}
      title={title}
      onClick={onClick}
      className={`flex-shrink-0 inline-flex items-center py-2 px-3 text-sm justify-center font-medium text-center text-white bg-green-500 rounded-lg hover:bg-green-600 focus-visible:outline-none shadow-sm border border-green-500 hover:border-green-600 gap-2 select-none disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-400 ${className}`}
    >
      {isLoading ? <LoadingIcon /> : icon}
      {children}
    </button>
  );
};
