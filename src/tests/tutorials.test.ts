// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { create } from '@bufbuild/protobuf';
import { blocks, excerpt, markStarted, nextLesson, readStarts } from '../pages/tutorials/lessons';
import { TutorialSchema } from '../types/launcher';

const TEXT = 'Intro paragraph.\n• First step\n• Second step\n\nClosing words.';

describe('tutorial text', () => {
  it('groups bullet lines into lists', () => {
    expect(blocks(TEXT)).toEqual([
      { kind: 'p', text: 'Intro paragraph.' },
      { kind: 'list', items: ['First step', 'Second step'] },
      { kind: 'p', text: 'Closing words.' },
    ]);
  });

  it('uses the first paragraph as the excerpt and cuts long ones at a word', () => {
    expect(excerpt(TEXT)).toBe('Intro paragraph.');
    expect(excerpt('one two three four five six', 15)).toBe('one two three…');
    expect(excerpt('')).toBe('');
  });
});

describe('tutorial progress', () => {
  beforeEach(() => localStorage.clear());

  const list = [3, 1, 2].map((number) => create(TutorialSchema, { number, title: `T${number}` }));

  it('remembers started lessons and suggests the next one', () => {
    expect(readStarts()).toEqual({});
    expect(nextLesson(list, readStarts())?.number).toBe(1);
    markStarted(1, 1000);
    expect(readStarts()).toEqual({ 1: 1000 });
    expect(nextLesson(list, readStarts())?.number).toBe(2);
    markStarted(2, 1001);
    markStarted(3, 1002);
    expect(nextLesson(list, readStarts())).toBeUndefined();
  });

  it('survives broken storage', () => {
    localStorage.setItem('neoomsi.tutorials.started', '{nope');
    expect(readStarts()).toEqual({});
  });
});
