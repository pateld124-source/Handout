import { test, expect } from '@playwright/test';
import { publicStorageUrl } from '@/lib/storageUrl';

const BASE = 'https://abcd1234.supabase.co';
const BUCKET = 'message-attachments';

test('returns a public object URL in the bucket', () => {
  const url = 'https://abcd1234.supabase.co/storage/v1/object/public/message-attachments/user-1/1700000000000-abc.jpg';
  expect(publicStorageUrl(url, BUCKET, BASE))
    .toBe('https://abcd1234.supabase.co/storage/v1/object/public/message-attachments/user-1/1700000000000-abc.jpg');
});

test('returns the URL in normalized form', () => {
  const url = 'HTTPS://ABCD1234.Supabase.co/storage/v1/object/public/message-attachments/user-1/my%20photo.jpg';
  expect(publicStorageUrl(url, BUCKET, BASE))
    .toBe('https://abcd1234.supabase.co/storage/v1/object/public/message-attachments/user-1/my%20photo.jpg');
});

test('keeps a cache-busting query string', () => {
  const url = 'https://abcd1234.supabase.co/storage/v1/object/public/message-attachments/user-1/a.jpg?t=123';
  expect(publicStorageUrl(url, BUCKET, BASE))
    .toBe('https://abcd1234.supabase.co/storage/v1/object/public/message-attachments/user-1/a.jpg?t=123');
});

test('rejects an object in another bucket', () => {
  const url = 'https://abcd1234.supabase.co/storage/v1/object/public/avatars/user-1/a.jpg';
  expect(publicStorageUrl(url, BUCKET, BASE)).toBeNull();
});

test('rejects a bucket whose name only starts with the bucket name', () => {
  const url = 'https://abcd1234.supabase.co/storage/v1/object/public/handouts-evil/user-1/a.pdf';
  expect(publicStorageUrl(url, 'handouts', BASE)).toBeNull();
});

test('rejects the same path on another origin', () => {
  const url = 'https://evil.example/storage/v1/object/public/message-attachments/user-1/a.jpg';
  expect(publicStorageUrl(url, BUCKET, BASE)).toBeNull();
});

test('rejects a lookalike host that starts with the Supabase host', () => {
  const url = 'https://abcd1234.supabase.co.evil.com/storage/v1/object/public/message-attachments/user-1/a.jpg';
  expect(publicStorageUrl(url, BUCKET, BASE)).toBeNull();
});

test('rejects URLs with userinfo', () => {
  expect(publicStorageUrl('https://abcd1234.supabase.co@evil.com/storage/v1/object/public/message-attachments/user-1/a.jpg', BUCKET, BASE)).toBeNull();
  expect(publicStorageUrl('https://user:pw@abcd1234.supabase.co/storage/v1/object/public/message-attachments/user-1/a.jpg', BUCKET, BASE)).toBeNull();
});

test('rejects plain http, even when the Supabase URL is http', () => {
  const url = 'http://abcd1234.supabase.co/storage/v1/object/public/message-attachments/user-1/a.jpg';
  expect(publicStorageUrl(url, BUCKET, BASE)).toBeNull();
  expect(publicStorageUrl(url, BUCKET, 'http://abcd1234.supabase.co')).toBeNull();
});

test('returns null instead of throwing for text that is not an absolute URL', () => {
  expect(publicStorageUrl('see you at 5', BUCKET, BASE)).toBeNull();
  expect(publicStorageUrl('/storage/v1/object/public/message-attachments/user-1/a.jpg', BUCKET, BASE)).toBeNull();
  expect(publicStorageUrl('https://abcd1234.supabase.co/storage/v1/object/public/message-attachments/user-1/a.jpg', BUCKET, '')).toBeNull();
});

test('rejects encoded dots, slashes or backslashes that could step out of the bucket', () => {
  expect(publicStorageUrl('https://abcd1234.supabase.co/storage/v1/object/public/message-attachments/..%2Favatars/a.jpg', BUCKET, BASE)).toBeNull();
  expect(publicStorageUrl('https://abcd1234.supabase.co/storage/v1/object/public/message-attachments/%2e%2e%5cavatars/a.jpg', BUCKET, BASE)).toBeNull();
});
