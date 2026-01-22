import React from 'react';
import { Image as BootstrapImage } from 'react-bootstrap/Image';
import { useNode } from '@craftjs/core';
import { ImageSettings } from './ImageSettings';

export const Image = ({ src, rounded, width, height }) => {
        const { connectors: { connect, drag } } = useNode();
    