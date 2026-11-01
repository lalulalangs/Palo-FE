import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ImageWithFallback } from './ImageWithFallback';

describe('ImageWithFallback component', () => {
  it('renders image with provided src and alt text', () => {
    render(
      <ImageWithFallback
        src="https://staging.palorinjani.com/storage/media/test.webp"
        alt="Kaos Rinjani"
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Kaos Rinjani');
  });

  it('uses fallback placeholder when src is null', () => {
    render(
      <ImageWithFallback
        src={null}
        alt="Produk Tanpa Foto"
        fallbackSrc="/placeholder-product.svg"
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('placeholder-product.svg');
    expect(img).toHaveAttribute('alt', 'Gambar belum tersedia untuk Produk Tanpa Foto');
  });

  it('switches to fallbackSrc on image error', () => {
    render(
      <ImageWithFallback
        src="https://broken-domain.test/404.webp"
        alt="Foto Rusak"
        fallbackSrc="/custom-fallback.svg"
      />,
    );

    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toContain('custom-fallback.svg');
  });
});
