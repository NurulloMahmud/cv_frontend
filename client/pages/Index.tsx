import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { CheckCircle2, Zap, Download, FileText } from 'lucide-react';

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Create Your <span className="text-primary">Professional CV</span> in Minutes
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                  Build a stunning, ATS-optimized resume with real-time preview. Choose from beautifully designed templates and download as PDF.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/builder"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Creating Now
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-8 py-4 border border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
                >
                  Learn More
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-border">
                <div>
                  <p className="text-2xl font-display font-bold text-primary">10K+</p>
                  <p className="text-sm text-muted-foreground">CVs Created</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-secondary">98%</p>
                  <p className="text-sm text-muted-foreground">User Satisfaction</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-accent">100%</p>
                  <p className="text-sm text-muted-foreground">Free to Use</p>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
                
                {/* CV Preview Card */}
                <div className="relative bg-white border border-border rounded-2xl shadow-2xl p-8 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold text-foreground">John Doe</h2>
                    <p className="text-sm text-muted-foreground">Frontend Developer</p>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>john@example.com | +1 (555) 123-4567</p>
                    <p>San Francisco, CA</p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="font-display font-semibold text-sm mb-3">EXPERIENCE</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-sm">Senior Developer</p>
                        <p className="text-xs text-muted-foreground">Tech Company • 2022 - Present</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Developer</p>
                        <p className="text-xs text-muted-foreground">Startup Inc • 2020 - 2022</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="font-display font-semibold text-sm mb-2">SKILLS</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">React</span>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">TypeScript</span>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">CSS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional CV building made simple with powerful features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary transition-colors group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <FileText className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Easy to Use</h3>
              <p className="text-sm text-muted-foreground">
                Intuitive form-based interface. No design skills needed.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary transition-colors group">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                <Zap className="w-6 h-6 text-secondary group-hover:text-secondary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Real-Time Preview</h3>
              <p className="text-sm text-muted-foreground">
                See changes instantly as you type. Perfect preview always ready.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary transition-colors group">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                <CheckCircle2 className="w-6 h-6 text-accent group-hover:text-accent-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Multiple Templates</h3>
              <p className="text-sm text-muted-foreground">
                Choose from professionally designed resume templates.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary transition-colors group">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Download className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">PDF Download</h3>
              <p className="text-sm text-muted-foreground">
                Export your CV as a professional PDF instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
            Ready to Build Your Perfect CV?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who've successfully created their CVs with TezCV.
          </p>
          <Link
            to="/builder"
            className="inline-flex items-center justify-center px-10 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all hover:shadow-lg hover:shadow-primary/20 text-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Create Your CV Now
          </Link>
        </div>
      </section>
    </Layout>
  );
}
