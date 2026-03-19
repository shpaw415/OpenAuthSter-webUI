

export function useParams<Params extends Record<string, string>>() {
    if(typeof window === "undefined") {
        return {} as Params;
    }
    return new URL(window.location.href).searchParams.toJSON() as Params;
}