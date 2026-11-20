import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { OpeningFilm } from './OpeningFilm';
import type { FilmContent } from '@/lib/homepage-static';

const mockFilmContent: FilmContent = {
  video_path: '/media/drive/opening-film.mp4',
  poster_path: '/media/drive/opening-film-poster.webp',
  chapter: 'CHAPTER 01',
  tag: '4K RAW',
  caption: 'Langkah pertama menuju Rinjani',
  spec: '01:24 • 24FPS',
  eyebrow: 'VISUAL ESSAY',
  title: 'Menapak Senaru',
  body: 'Catatan perjalanan dari kaki gunung.',
  cta_primary_label: 'Lihat Koleksi',
  cta_primary_url: '/produk',
  facts: [],
};

describe('OpeningFilm component', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        unobserve = vi.fn();
      },
    );

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('toggles video.muted and aria-label when clicking audio button', async () => {
    const { container } = render(<OpeningFilm content={mockFilmContent} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Jeda video' })).toBeInTheDocument();
    });
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video.muted).toBe(true);

    const unmuteBtn = screen.getByRole('button', { name: 'Nyalakan suara video' });
    fireEvent.click(unmuteBtn);

    expect(video.muted).toBe(false);
    expect(screen.getByRole('button', { name: 'Matikan suara video' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Matikan suara video' }));
    expect(video.muted).toBe(true);
    expect(screen.getByRole('button', { name: 'Nyalakan suara video' })).toBeInTheDocument();
  });

  it('places top controls container at z-20 above z-10 play/pause overlay', async () => {
    render(<OpeningFilm content={mockFilmContent} />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Jeda video' })).toBeInTheDocument();
    });

    const audioBtn = screen.getByRole('button', { name: 'Nyalakan suara video' });
    const topControls = audioBtn.parentElement;
    const playOverlay = screen.getByRole('button', { name: /Putar video|Jeda video/ });

    expect(topControls).toHaveClass('z-20');
    expect(playOverlay).toHaveClass('z-10');
  });

  it('updates play/pause button aria-label and icon on play and pause events', async () => {
    const { container } = render(<OpeningFilm content={mockFilmContent} />);
    const video = container.querySelector('video') as HTMLVideoElement;

    // Wait for mount autoplay promise to settle
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Jeda video' })).toBeInTheDocument();
    });

    const pauseBtn = screen.getByRole('button', { name: 'Jeda video' });
    expect(pauseBtn.querySelectorAll('svg rect')).toHaveLength(2);

    // Pause event -> switches to play state & icon
    fireEvent.pause(video);
    const playBtn = screen.getByRole('button', { name: 'Putar video' });
    expect(playBtn).toBeInTheDocument();
    expect(playBtn.querySelectorAll('svg path')).toHaveLength(1);
    expect(playBtn.querySelectorAll('svg rect')).toHaveLength(0);

    // Play event -> switches back to pause state & icon
    fireEvent.play(video);
    const pauseBtnAgain = screen.getByRole('button', { name: 'Jeda video' });
    expect(pauseBtnAgain).toBeInTheDocument();
    expect(pauseBtnAgain.querySelectorAll('svg rect')).toHaveLength(2);
  });
});
