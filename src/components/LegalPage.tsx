import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface LegalPageProps {
    markdownUrl: string;
    title: string;
}

export default function LegalPage({ markdownUrl, title }: LegalPageProps) {
    const [content, setContent] = useState<string>('');

    useEffect(() => {
        fetch(markdownUrl)
            .then((res) => res.text())
            .then((text) => {
                const html = marked(text);
                setContent(html as string);
            })
            .catch((err) => {
                console.error('Failed to load legal document:', err);
                setContent('<p>Failed to load document. Please try again later.</p>');
            });
    }, [markdownUrl]);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Header */}
            <header className="w-full border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link
                        to="/"
                        className="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                    >
                        ← PROXLE
                    </Link>
                    <h1 className="text-lg font-semibold text-white/80">{title}</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <article
                    className="prose prose-invert prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-white
            prose-h1:text-4xl prose-h1:mb-8 prose-h1:bg-gradient-to-r prose-h1:from-cyan-400 prose-h1:to-purple-500 prose-h1:bg-clip-text prose-h1:text-transparent
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-white/70 prose-p:leading-relaxed
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:text-white/70 prose-ol:text-white/70
            prose-li:my-1
            prose-code:text-cyan-400 prose-code:bg-white/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-blockquote:border-l-4 prose-blockquote:border-cyan-500/50 prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-white/10 bg-white/5 backdrop-blur-md mt-20">
                <div className="max-w-4xl mx-auto px-6 py-8 text-center">
                    <div className="flex gap-6 justify-center mb-4 text-sm">
                        <Link to="/privacy" className="text-white/50 hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="text-white/50 hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                        <a href="mailto:support@proxle.app" className="text-white/50 hover:text-white transition-colors">
                            Contact
                        </a>
                    </div>
                    <p className="text-xs text-white/30 mt-4">
                        Made with ❤️ for my Loving Wife
                    </p>
                    <p className="text-[10px] text-white/20 mt-2">
                        <a
                            href="https://skyboundmi.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white/40 transition-colors"
                        >
                            © {new Date().getFullYear()} Skybound Solutions, LLC
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
