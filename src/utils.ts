

export function navigate(path: string) {
    const a = document.createElement('a');
    a.href = path;
    a.click();
}