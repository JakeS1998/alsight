import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: 60000,
			retryOnMount: false,
			retry: (failureCount, error) => {
				const status = Number(error?.response?.status || error?.status);
				const message = String(error?.response?.data?.error || error?.message || '');
				if (status === 429 || /rate limit|too many requests/i.test(message)) return false;
				return failureCount < 1 && (!status || status >= 500);
			},
		},
	},
});