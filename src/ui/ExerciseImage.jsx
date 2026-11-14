"use client";

import Image from "next/image";
import { useRef } from "react";

const FULL_WIDTH = 850;
const FULL_HEIGHT = 567;

export function ExerciseImage({ exerciseId, name, size = 64 }) {
  const dialog = useRef(null);
  const source = `/exercises/${exerciseId}.jpg`;

  function open(event) {
    event.preventDefault();
    event.stopPropagation();
    dialog.current?.showModal();
  }

  return (
    <>
      <button className="image-button" type="button" onClick={open} aria-label={`Rodyti nuotrauką: ${name}`}>
        <Image className="exercise-image" src={source} alt="" width={Math.round(size * 1.5)} height={size} />
      </button>
      <dialog ref={dialog} className="image-dialog" onClick={() => dialog.current?.close()}>
        <Image src={source} alt={name} width={FULL_WIDTH} height={FULL_HEIGHT} />
        <p>{name}</p>
      </dialog>
    </>
  );
}
